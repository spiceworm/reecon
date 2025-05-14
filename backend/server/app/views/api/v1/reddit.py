import logging

import rq.exceptions
from constance import config
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
        llm_providers_settings = submit_serializer.validated_data["llm_providers_settings"]
        prompt = submit_serializer.validated_data["prompt"]
        username = submit_serializer.validated_data["username"]

        log.debug("Received %s: %s", username, prompt)

        if config.REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED:
            env = schemas.get_worker_env()
            env.redditor.llm.prompts.process_context_query = prompt

            # Do not explicitly set a job id because context-query jobs should have unique IDs.
            # Multiple users could submit a context query for the same redditor, but each query
            # will create a new job.
            job_queue = django_rq.get_queue("high")
            job = job_queue.enqueue(
                "app.worker.process_redditor_context_query",  # this function is defined in the worker app
                kwargs={
                    "redditor_username": username,
                    "contributor": request.user,
                    "context_query_llm": models.LLM.objects.get(name=llm_name),
                    "data_llm": models.LLM.objects.get(name=config.LLM_NAME),
                    "llm_providers_settings": llm_providers_settings,
                    "submitter": request.user,
                    "env": env,
                },
            )

            job_id = job.id
        else:
            job_id = ""
            log.debug("Redditor context query processing is disabled")

        response_serializer = serializers.RedditorContextQueryCreateResponseSerializer(
            instance={
                "job_id": job_id,
            }
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        responses=serializers.RedditorContextQueryListResponseSerializer,
    )
    def list(self, request, *args, **kwargs):
        queryset = models.RedditorContextQuery.objects.filter(request_meta__submitter=request.user)
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
            return Response({}, status=status.HTTP_404_NOT_FOUND)

        if job.is_finished:
            obj: models.RedditorContextQuery | models.UnprocessableRedditorContextQuery = job.return_value()
            response_serializer = serializers.RedditorContextQueryRetrieveResponseSerializer(
                instance={
                    "error": obj if isinstance(obj, models.UnprocessableRedditorContextQuery) else None,
                    "success": obj if isinstance(obj, models.RedditorContextQuery) else None,
                }
            )
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
        llm_providers_settings: schemas.LlmProvidersSettings = submit_serializer.validated_data["llm_providers_settings"]
        usernames = set(submit_serializer.validated_data["usernames"])
        log.debug("Received %s", usernames)

        # Redditors that are already in the database.
        known_redditors = self.get_queryset().filter(username__in=usernames)
        known_usernames = set(known_redditors.values_list("username", flat=True))

        # Usernames of redditors in the database that were inserted recently and not considered stale yet.
        fresh_usernames = set(
            known_redditors.exclude(last_processed__lt=timezone.now() - config.REDDITOR_FRESHNESS_TD).values_list(
                "username",
                flat=True,
            )
        )

        unprocessable_redditors = models.UnprocessableRedditor.objects.filter(username__in=usernames)
        unprocessable_usernames = set(unprocessable_redditors.values_list("username", flat=True))

        ignored_redditors = models.IgnoredRedditor.objects.filter(username__in=usernames)
        ignored_usernames = set(ignored_redditors.values_list("username", flat=True))

        # This should only contain unprocessed usernames and 'stale' entries that need to be reprocessed.
        pending_usernames = usernames - fresh_usernames - unprocessable_usernames - ignored_usernames
        pending_redditors = []

        if config.REDDITOR_DATA_PROCESSING_ENABLED:
            llm = models.LLM.objects.get(name=config.LLM_NAME)
            env = schemas.get_worker_env()

            job_queue = django_rq.get_queue("default")
            existing_job_ids = set(job_queue.get_job_ids())

            for redditor_username in pending_usernames:
                # If this is a stale entry that is being reprocessed, we do not want it to be included in the pending list.
                # The old entry will still be returned in the response under the 'processed' key, but the username will be
                # enqueued so that it can be reprocessed. I think it is better UX that the user who triggered this request
                # receives the stale entry in the response compared to having the stale redditor marked as pending in the DOM
                # and waiting for the job that reprocesses the stale username to finish processing.
                if redditor_username not in known_usernames:
                    pending_redditors.append({"username": redditor_username})

                job_id = f"redditor-{redditor_username}"
                if job_id not in existing_job_ids:
                    job_queue.enqueue(
                        "app.worker.process_redditor_data",  # this function is defined in the worker app
                        kwargs={
                            "redditor_username": redditor_username,
                            "contributor": request.user,
                            "llm": llm,
                            "llm_providers_settings": llm_providers_settings,
                            "submitter": request.user,
                            "env": env,
                        },
                        job_id=job_id,
                    )
                else:
                    log.debug("Not enqueuing duplicate job for %s", redditor_username)
        else:
            log.debug("Redditor data processing is disabled")

        response_serializer = serializers.RedditorDataResponseSerializer(
            instance={
                "ignored": ignored_redditors,
                "pending": pending_redditors,
                "processed": known_redditors,
                "unprocessable": unprocessable_redditors,
            }
        )
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
        llm_providers_settings: schemas.LlmProvidersSettings = submit_serializer.validated_data["llm_providers_settings"]
        prompt = submit_serializer.validated_data["prompt"]
        thread_path = submit_serializer.validated_data["path"]

        log.debug("Received %s: %s", thread_path, prompt)

        if config.THREAD_CONTEXT_QUERY_PROCESSING_ENABLED:
            env = schemas.get_worker_env()
            env.thread.llm.prompts.process_context_query = prompt

            # Do not explicitly set a job id because context-query jobs should have unique IDs.
            # Multiple users could submit a context query for the same thread, but each query
            # will create a new job.
            job_queue = django_rq.get_queue("high")
            job = job_queue.enqueue(
                "app.worker.process_thread_context_query",  # this function is defined in the worker app
                kwargs={
                    "thread_path": thread_path,
                    "contributor": request.user,
                    "context_query_llm": models.LLM.objects.get(name=llm_name),
                    "data_llm": models.LLM.objects.get(name=config.LLM_NAME),
                    "llm_providers_settings": llm_providers_settings,
                    "submitter": request.user,
                    "env": env,
                },
            )

            job_id = job.id
        else:
            job_id = ""
            log.debug("Thread context query processing is disabled")

        response_serializer = serializers.ThreadContextQueryCreateResponseSerializer(
            instance={
                "job_id": job_id,
            }
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        responses=serializers.ThreadContextQueryListResponseSerializer,
    )
    def list(self, request, *args, **kwargs):
        queryset = models.ThreadContextQuery.objects.filter(request_meta__submitter=request.user)
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
            response_serializer = serializers.ThreadContextQueryRetrieveResponseSerializer(
                instance={
                    "error": obj if isinstance(obj, models.UnprocessableThreadContextQuery) else None,
                    "success": obj if isinstance(obj, models.ThreadContextQuery) else None,
                }
            )
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
        llm_providers_settings: schemas.LlmProvidersSettings = submit_serializer.validated_data["llm_providers_settings"]
        thread_paths = set(submit_serializer.validated_data["paths"])
        log.debug("Received %s", thread_paths)

        # Threads that are already in the database.
        known_threads = self.get_queryset().filter(path__in=thread_paths)
        known_paths = set(known_threads.values_list("path", flat=True))

        # URL paths of threads in the database that were inserted recently and not considered stale yet.
        fresh_paths = set(
            known_threads.exclude(last_processed__lt=timezone.now() - config.THREAD_FRESHNESS_TD).values_list(
                "path",
                flat=True,
            )
        )

        unprocessable_threads = models.UnprocessableThread.objects.filter(path__in=thread_paths)
        unprocessable_paths = set(unprocessable_threads.values_list("path", flat=True))

        # This should only contain unprocessed paths and 'stale' entries that need to be reprocessed.
        pending_paths = thread_paths - fresh_paths - unprocessable_paths
        pending_threads = []

        if config.THREAD_DATA_PROCESSING_ENABLED:
            llm = models.LLM.objects.get(name=config.LLM_NAME)
            env = schemas.get_worker_env()

            job_queue = django_rq.get_queue("default")
            existing_job_ids = set(job_queue.get_job_ids())

            for thread_path in pending_paths:
                # If this is a stale entry that is being reprocessed, we do not want it to be included in the pending list.
                # The old entry will still be returned in the response under the 'processed' key, but the path will be
                # enqueued so that it can be reprocessed. I think it is better UX that the user who triggered this request
                # receives the stale entry in the response compared to having the stale thread marked as pending in the DOM
                # and waiting for the job that reprocesses the stale path to finish processing.
                if thread_path not in known_paths:
                    pending_threads.append({"path": thread_path})

                path_parts = thread_path.split("/")
                subreddit, thread_id = path_parts[2], path_parts[4]

                # Using the full thread URL as the job id causes the job to get enqueued but never executed.
                # Maybe it's because of the length of the job id or symbols that are in the URL?

                job_id = f"thread-{subreddit}-{thread_id}"
                if job_id not in existing_job_ids:
                    job_queue.enqueue(
                        "app.worker.process_thread_data",  # this function is defined in the worker app
                        kwargs={
                            "thread_path": thread_path,
                            "contributor": request.user,
                            "llm": llm,
                            "llm_providers_settings": llm_providers_settings,
                            "submitter": request.user,
                            "env": env,
                        },
                        job_id=job_id,
                    )
                else:
                    log.debug("Not enqueuing duplicate job for %s", thread_path)
        else:
            log.debug("Thread data processing is disabled")

        response_serializer = serializers.ThreadDataResponseSerializer(
            instance={
                "pending": pending_threads,
                "processed": known_threads,
                "unprocessable": unprocessable_threads,
            }
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
