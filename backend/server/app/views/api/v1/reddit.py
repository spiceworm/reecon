import logging
from urllib.parse import urlparse

import rq.exceptions
from constance import config
from django.contrib.auth.models import User
from django.utils import timezone
import django_rq
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rq.job import Job

from reecon import (
    models,
    schemas,
)

from .... import serializers


__all__ = (
    "RedditorContextQueryViewSet",
    "RedditorDataViewSet",
    "ThreadContextQueryViewSet",
    "ThreadDataViewSet",
)


log = logging.getLogger("app.views.api.v1.reddit")


class RedditorContextQueryViewSet(GenericViewSet):
    lookup_url_kwarg = "job_id"

    @extend_schema(
        request=serializers.RedditorContextQueryCreateRequestSerializer,
        responses=serializers.RedditorContextQueryCreateResponseSerializer,
    )
    def create(self, request: Request) -> Response:
        submit_serializer = serializers.RedditorContextQueryCreateRequestSerializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)

        llm_name = submit_serializer.validated_data["llm_name"]
        nlp_name = submit_serializer.validated_data["nlp_name"]
        producer_settings = submit_serializer.validated_data["producer_settings"]
        prompt = submit_serializer.validated_data["prompt"]
        username = submit_serializer.validated_data["username"]

        log.debug("Received %s: %s", username, prompt)

        llm_contributor = request.user
        llm_producer = models.Producer.objects.get(name=llm_name)
        nlp_contributor = User.objects.get(username="admin")
        nlp_producer = models.Producer.objects.get(name=nlp_name)
        submitter = request.user
        env = schemas.get_worker_env()
        env.redditor.llm.prompts.process_context_query = prompt


        if config.REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED:
            # Do not explicitly set a job id because context-query jobs should have unique IDs.
            # Multiple users could submit a context query for the same redditor, but each query
            # will create a new job.
            job = django_rq.enqueue(
                "app.worker.process_redditor_context_query",  # this function is defined in the worker app
                at_front=True,
                kwargs={
                    "redditor_username": username,
                    "llm_contributor": llm_contributor,
                    "llm_producer": llm_producer,
                    "nlp_contributor": nlp_contributor,
                    "nlp_producer": nlp_producer,
                    "producer_settings": producer_settings,
                    "submitter": submitter,
                    "env": env,
                },
            )

            job_id = job.id
        else:
            job_id = ""
            log.debug("Redditor context query processing is disabled")

        data = {
            "job_id": job_id,
        }

        response_serializer = serializers.RedditorContextQueryCreateResponseSerializer(instance=data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        responses=serializers.RedditorContextQueryListResponseSerializer,
    )
    def list(self, request, *args, **kwargs):
        queryset = request.user.submitted_redditor_context_queries.all()
        response_serializer = serializers.RedditorContextQueryListResponseSerializer(instance=queryset, many=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        parameters=[
            OpenApiParameter("job_id", OpenApiTypes.STR, OpenApiParameter.PATH),
        ],
        responses=serializers.RedditorContextQueryRetrieveResponseSerializer,
    )
    def retrieve(self, request: Request, job_id) -> Response:
        try:
            job = Job.fetch(job_id, connection=django_rq.get_connection())
        except rq.exceptions.NoSuchJobError:
            return Response({}, status=status.HTTP_400_BAD_REQUEST)

        if job.is_finished:
            obj: models.RedditorContextQuery | models.UnprocessableRedditorContextQuery = job.return_value()
            data = {
                "error": obj if isinstance(obj, models.UnprocessableRedditorContextQuery) else None,
                "success": obj if isinstance(obj, models.RedditorContextQuery) else None,
            }
            response_serializer = serializers.RedditorContextQueryRetrieveResponseSerializer(instance=data)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        return Response({}, status=status.HTTP_202_ACCEPTED)


class RedditorDataViewSet(GenericViewSet):
    queryset = models.Redditor.objects.all()
    serializer_class = serializers.RedditorDataRequestSerializer

    @extend_schema(
        request=serializers.RedditorDataRequestSerializer,
        responses=serializers.RedditorDataResponseSerializer,
    )
    def create(self, request: Request):
        submit_serializer = serializers.RedditorDataRequestSerializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)
        producer_settings = submit_serializer.validated_data["producer_settings"]
        usernames = set(submit_serializer.validated_data["usernames"])
        log.debug("Received %s", usernames)

        # Redditors that are already in the database.
        known_redditors = self.get_queryset().filter(username__in=usernames)
        known_usernames = set(known_redditors.values_list("username", flat=True))

        # Usernames of redditors in the database that were inserted recently and not considered stale yet.
        fresh_usernames = set(
            known_redditors.exclude(last_processed__lte=timezone.now() - config.REDDITOR_FRESHNESS_TD).values_list(
                "username",
                flat=True,
            )
        )

        # Delete unprocessable redditors that are expired and can attempt to be processed again.
        # TODO: Should deletion of expired objects be handled by a separate process that runs on a schedule?
        models.UnprocessableRedditor.objects.filter(
            created__lte=timezone.now() - config.UNPROCESSABLE_REDDITOR_EXP_TD
        ).delete()

        unprocessable_redditors = models.UnprocessableRedditor.objects.filter(username__in=usernames)
        unprocessable_usernames = set(unprocessable_redditors.values_list("username", flat=True))

        ignored_redditors = models.IgnoredRedditor.objects.filter(username__in=usernames)
        ignored_usernames = set(ignored_redditors.values_list("username", flat=True))

        pending_usernames = (
            set(usernames) - known_usernames - fresh_usernames - unprocessable_usernames - ignored_usernames
        )
        pending_redditors = []

        llm_contributor = request.user
        llm_producer = models.Producer.objects.get(name=config.LLM_NAME)
        nlp_contributor = User.objects.get(username="admin")
        nlp_producer = models.Producer.objects.get(name=config.NLP_NAME)
        submitter = request.user
        env = schemas.get_worker_env()

        if config.REDDITOR_DATA_PROCESSING_ENABLED:
            job_queue = django_rq.get_queue()
            existing_job_ids = set(job_queue.get_job_ids())

            for redditor_username in pending_usernames:
                pending_redditors.append({"username": redditor_username})

                job_id = f"redditor-{redditor_username}"
                if job_id not in existing_job_ids:
                    job_queue.enqueue(
                        "app.worker.process_redditor_data",  # this function is defined in the worker app
                        kwargs={
                            "redditor_username": redditor_username,
                            "llm_contributor": llm_contributor,
                            "llm_producer": llm_producer,
                            "nlp_contributor": nlp_contributor,
                            "nlp_producer": nlp_producer,
                            "producer_settings": producer_settings,
                            "submitter": submitter,
                            "env": env,
                        },
                        job_id=job_id,
                    )
                else:
                    log.debug("Not enqueuing duplicate job for %s", redditor_username)
        else:
            log.debug("Redditor data processing is disabled")

        data = {
            "ignored": ignored_redditors,
            "pending": pending_redditors,
            "processed": known_redditors,
            "unprocessable": unprocessable_redditors,
        }

        response_serializer = serializers.RedditorDataResponseSerializer(instance=data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ThreadContextQueryViewSet(GenericViewSet):
    lookup_url_kwarg = "job_id"

    @extend_schema(
        request=serializers.ThreadContextQueryCreateRequestSerializer,
        responses=serializers.ThreadContextQueryCreateResponseSerializer,
    )
    def create(self, request: Request):
        submit_serializer = serializers.ThreadContextQueryCreateRequestSerializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)

        llm_name = submit_serializer.validated_data["llm_name"]
        nlp_name = submit_serializer.validated_data["nlp_name"]
        producer_settings = submit_serializer.validated_data["producer_settings"]
        prompt = submit_serializer.validated_data["prompt"]
        url_path = submit_serializer.validated_data["path"]

        log.debug("Received %s: %s", url_path, prompt)
        thread_url = f"https://reddit.com{url_path}"

        llm_contributor = request.user
        llm_producer = models.Producer.objects.get(name=llm_name)
        nlp_contributor = User.objects.get(username="admin")
        nlp_producer = models.Producer.objects.get(name=nlp_name)
        submitter = request.user
        env = schemas.get_worker_env()
        env.thread.llm.prompts.process_context_query = prompt

        if config.THREAD_CONTEXT_QUERY_PROCESSING_ENABLED:
            # Do not explicitly set a job id because context-query jobs should have unique IDs.
            # Multiple users could submit a context query for the same thread, but each query
            # will create a new job.
            job = django_rq.enqueue(
                "app.worker.process_thread_context_query",  # this function is defined in the worker app
                at_front=True,
                kwargs={
                    "thread_url": thread_url,
                    "llm_contributor": llm_contributor,
                    "llm_producer": llm_producer,
                    "nlp_contributor": nlp_contributor,
                    "nlp_producer": nlp_producer,
                    "producer_settings": producer_settings,
                    "submitter": submitter,
                    "env": env,
                },
            )

            job_id = job.id
        else:
            job_id = ""
            log.debug("Thread context query processing is disabled")

        data = {
            "job_id": job_id,
        }

        response_serializer = serializers.ThreadContextQueryCreateResponseSerializer(instance=data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        responses=serializers.ThreadContextQueryListResponseSerializer,
    )
    def list(self, request, *args, **kwargs):
        queryset = request.user.submitted_thread_context_queries.all()
        response_serializer = serializers.ThreadContextQueryListResponseSerializer(instance=queryset, many=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        parameters=[
            OpenApiParameter("job_id", OpenApiTypes.STR, OpenApiParameter.PATH),
        ],
        responses=serializers.ThreadContextQueryRetrieveResponseSerializer,
    )
    def retrieve(self, request: Request, job_id) -> Response:
        try:
            job = Job.fetch(job_id, connection=django_rq.get_connection())
        except rq.exceptions.NoSuchJobError:
            return Response({}, status=status.HTTP_404_NOT_FOUND)

        if job.is_finished:
            obj: models.ThreadContextQuery | models.UnprocessableThreadContextQuery = job.return_value()
            data = {
                "error": obj if isinstance(obj, models.UnprocessableThreadContextQuery) else None,
                "success": obj if isinstance(obj, models.ThreadContextQuery) else None,
            }
            response_serializer = serializers.ThreadContextQueryRetrieveResponseSerializer(instance=data)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        return Response({}, status=status.HTTP_202_ACCEPTED)


class ThreadDataViewSet(GenericViewSet):
    queryset = models.Thread.objects.all()
    serializer_class = serializers.ThreadDataRequestSerializer

    @extend_schema(
        request=serializers.ThreadDataRequestSerializer,
        responses=serializers.ThreadDataResponseSerializer,
    )
    def create(self, request: Request):
        submit_serializer = self.get_serializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)
        producer_settings = submit_serializer.validated_data["producer_settings"]
        url_paths = set(submit_serializer.validated_data["paths"])
        log.debug("Received %s", url_paths)
        thread_urls = [f"https://reddit.com{path}" for path in url_paths]

        # Threads that are already in the database.
        known_threads = self.get_queryset().filter(url__in=thread_urls)
        known_urls = set(known_threads.values_list("url", flat=True))

        # URLs of threads in the database that were inserted recently and not considered stale yet.
        fresh_urls = set(
            known_threads.exclude(last_processed__lte=timezone.now() - config.THREAD_FRESHNESS_TD).values_list(
                "url",
                flat=True,
            )
        )

        # Delete unprocessable threads that are expired and can attempt to be processed again.
        # TODO: Should deletion of expired objects be handled by a separate process that runs on a schedule?
        models.UnprocessableThread.objects.filter(
            created__lte=timezone.now() - config.UNPROCESSABLE_THREAD_EXP_TD
        ).delete()

        unprocessable_threads = models.UnprocessableThread.objects.filter(url__in=thread_urls)
        unprocessable_urls = set(unprocessable_threads.values_list("url", flat=True))

        pending_urls = set(thread_urls) - known_urls - fresh_urls - unprocessable_urls
        pending_threads = []

        llm_contributor = request.user
        llm_producer = models.Producer.objects.get(name=config.LLM_NAME)
        nlp_contributor = User.objects.get(username="admin")
        nlp_producer = models.Producer.objects.get(name=config.NLP_NAME)
        submitter = request.user
        env = schemas.get_worker_env()

        if config.THREAD_DATA_PROCESSING_ENABLED:
            job_queue = django_rq.get_queue()
            existing_job_ids = set(job_queue.get_job_ids())

            for thread_url in pending_urls:
                thread_path = urlparse(thread_url).path
                pending_threads.append({"path": thread_path, "url": thread_url})

                path_parts = thread_path.split("/")
                subreddit, thread_id = path_parts[2], path_parts[4]

                # Using the full thread URL as the job id causes the job to get enqueued but never executed.
                # Maybe it's because of the length of the job id or symbols that are in the URL?

                job_id = f"thread-{subreddit}-{thread_id}"
                if job_id not in existing_job_ids:
                    job_queue.enqueue(
                        "app.worker.process_thread_data",  # this function is defined in the worker app
                        kwargs={
                            "thread_url": thread_url,
                            "llm_contributor": llm_contributor,
                            "llm_producer": llm_producer,
                            "nlp_contributor": nlp_contributor,
                            "nlp_producer": nlp_producer,
                            "producer_settings": producer_settings,
                            "submitter": submitter,
                            "env": env,
                        },
                        job_id=job_id,
                    )
                else:
                    log.debug("Not enqueuing duplicate job for %s", thread_url)
        else:
            log.debug("Thread data processing is disabled")

        data = {
            "pending": pending_threads,
            "processed": known_threads,
            "unprocessable": unprocessable_threads,
        }

        response_serializer = serializers.ThreadDataResponseSerializer(instance=data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
