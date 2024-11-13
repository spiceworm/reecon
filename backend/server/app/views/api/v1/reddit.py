import logging
from urllib.parse import urlparse

from constance import config
from django.contrib.auth.models import User
from django.utils import timezone
import django_rq
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.request import Request
from rest_framework.response import Response

from .... import (
    models,
    serializers,
    worker,
)


__all__ = (
    "RedditorsView",
    "ThreadsView",
)


log = logging.getLogger("app.views.api.v1.reddit")


@extend_schema(responses=serializers.RedditorResponseSerializer())
class RedditorsView(CreateAPIView):
    queryset = models.Redditor.objects.all()
    serializer_class = serializers.RedditorRequestSerializer

    def create(self, request: Request, *args, **kwargs):
        submit_serializer = self.get_serializer(data=request.data)
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
        unprocessable_usernames = {redditor.username for redditor in unprocessable_redditors}

        ignored_redditors = models.IgnoredRedditor.objects.filter(username__in=usernames)
        ignored_usernames = set(ignored_redditors.values_list("username", flat=True))

        pending_usernames = (
            set(usernames) - known_usernames - fresh_usernames - unprocessable_usernames - ignored_usernames
        )
        pending_redditors = []

        llm_contributor = request.user
        nlp_contributor = User.objects.get(username="admin")

        if config.REDDITOR_PROCESSING_ENABLED:
            for redditor_username in pending_usernames:
                pending_redditors.append({"username": redditor_username})
                django_rq.enqueue(
                    worker.process_redditor,
                    redditor_username,
                    llm_contributor,
                    nlp_contributor,
                    producer_settings,
                    job_id=f"redditor-{redditor_username}",
                )
        else:
            log.debug("Redditor processing is disabled")

        data = {
            "ignored": ignored_redditors,
            "pending": pending_redditors,
            "processed": known_redditors,
            "unprocessable": unprocessable_redditors,
        }

        response_serializer = serializers.RedditorResponseSerializer(instance=data)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@extend_schema(responses=serializers.ThreadResponseSerializer(many=True))
class ThreadsView(CreateAPIView):
    queryset = models.Thread.objects.all()
    serializer_class = serializers.ThreadRequestSerializer

    def create(self, request: Request, *args, **kwargs):
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
        models.UnprocessableThread.objects.filter(created__lte=timezone.now() - config.UNPROCESSABLE_THREAD_EXP_TD).delete()

        unprocessable_threads = models.UnprocessableThread.objects.filter(url__in=thread_urls)
        unprocessable_urls = {thread.url for thread in unprocessable_threads}

        pending_urls = set(thread_urls) - known_urls - fresh_urls - unprocessable_urls
        pending_threads = []

        llm_contributor = request.user
        nlp_contributor = User.objects.get(username="admin")

        if config.THREAD_PROCESSING_ENABLED:
            for thread_url in pending_urls:
                thread_path = urlparse(thread_url).path
                pending_threads.append({"path": thread_path, "url": thread_url})

                path_parts = thread_path.split("/")
                subreddit, thread_id = path_parts[2], path_parts[4]

                # Using the full thread URL as the job id causes the job to get enqueued but never executed.
                # Maybe it's because of the length of the job id or symbols that are in the URL?

                django_rq.enqueue(
                    worker.process_thread,
                    thread_url,
                    llm_contributor,
                    nlp_contributor,
                    producer_settings,
                    job_id=f"thread-{subreddit}-{thread_id}",
                )
        else:
            log.debug("Thread processing is disabled")

        data = {
            "pending": pending_threads,
            "processed": known_threads,
            "unprocessable": unprocessable_threads,
        }

        response_serializer = serializers.ThreadResponseSerializer(instance=data)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
