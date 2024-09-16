import logging

from django.conf import settings
from django.utils import timezone
import django_rq
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
)
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.request import Request
from rest_framework.response import Response

from ....models import (
    Redditor,
    IgnoredRedditor,
    Thread,
    UnprocessableRedditor,
    UnprocessableThread,
)
from ....serializers import (
    RedditorSerializer,
    RedditorUsernameSerializer,
    ThreadSerializer,
    ThreadUrlPathsSerializer,
)


__all__ = (
    "RedditorsView",
    "ThreadsView",
)


log = logging.getLogger("app.views.api.v1.reddit")


def response_schema(**kwargs):
    def decorator(view):
        extend_schema_view(
            create=extend_schema(responses={201: kwargs["serializer"]}),
        )(view)
        return view

    return decorator


@response_schema(serializer=RedditorSerializer(many=True))
class RedditorsView(CreateAPIView):
    queryset = Redditor.objects.all()
    serializer_class = RedditorUsernameSerializer

    def create(self, request, *args, **kwargs):
        submit_serializer = self.get_serializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)
        usernames = set(submit_serializer.data["usernames"])
        log.debug("Received %s", usernames)

        # Redditors that are already in the database.
        known_redditors = self.get_queryset().filter(username__in=usernames)
        known_usernames = set(known_redditors.values_list("username", flat=True))

        # Usernames of redditors in the database that were inserted recently and not considered stale yet.
        fresh_usernames = set(
            known_redditors.exclude(last_processed__lte=timezone.now() - settings.REDDITOR_FRESHNESS_TD).values_list(
                "username",
                flat=True,
            )
        )

        # Delete unprocessable redditors that are expired and can attempt to be processed again.
        # TODO: Should deletion of expired objects be handled by a separate process that runs on a schedule?
        UnprocessableRedditor.objects.filter(
            created__lte=timezone.now() - settings.UNPROCESSABLE_REDDITOR_EXP_TD
        ).delete()
        unprocessable_usernames = {redditor.username for redditor in UnprocessableRedditor.objects.only("username")}
        # TODO: clients should have a list of ignored usernames so they never get submit for processing
        ignored_usernames = {redditor.username for redditor in IgnoredRedditor.objects.only("username")}

        queue = django_rq.get_queue("default")
        for redditor_username in (
            set(usernames) - known_usernames - fresh_usernames - unprocessable_usernames - ignored_usernames
        ):
            purchaser_username = request.user.get_username()
            queue.enqueue(
                "app.worker.jobs.reddit.process_redditor",
                redditor_username,
                purchaser_username,
                job_id=redditor_username,
                result_ttl=0,
            )

        response_serializer = RedditorSerializer(instance=known_redditors, many=True)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@response_schema(serializer=ThreadSerializer(many=True))
class ThreadsView(CreateAPIView):
    queryset = Thread.objects.all()
    serializer_class = ThreadUrlPathsSerializer

    def create(self, request: Request, *args, **kwargs):
        submit_serializer = self.get_serializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)
        url_paths = set(submit_serializer.data["paths"])
        log.debug("Received %s", url_paths)
        thread_urls = [f"https://old.reddit.com{path}" for path in url_paths]

        # Threads that are already in the database.
        known_threads = self.get_queryset().filter(url__in=thread_urls)
        known_urls = set(known_threads.values_list("url", flat=True))

        # URLs of threads in the database that were inserted recently and not considered stale yet.
        fresh_urls = set(
            known_threads.exclude(last_processed__lte=timezone.now() - settings.THREAD_FRESHNESS_TD).values_list(
                "url",
                flat=True,
            )
        )

        # Delete unprocessable threads that are expired and can attempt to be processed again.
        # TODO: Should deletion of expired objects be handled by a separate process that runs on a schedule?
        UnprocessableThread.objects.filter(created__lte=timezone.now() - settings.UNPROCESSABLE_THREAD_EXP_TD).delete()
        unprocessable_urls = {thread.url for thread in UnprocessableThread.objects.only("url")}

        queue = django_rq.get_queue("default")
        for url in set(thread_urls) - known_urls - fresh_urls - unprocessable_urls:
            queue.enqueue("app.worker.jobs.reddit.process_thread", url, job_id=url, result_ttl=0)

        response_serializer = ThreadSerializer(instance=known_threads, many=True)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
