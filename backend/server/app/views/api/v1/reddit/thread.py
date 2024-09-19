import logging

from constance import config
from django.contrib.auth.models import User
from django.utils import timezone
import django_rq
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.request import Request
from rest_framework.response import Response

from ..util import response_schema
from .....models import (
    Thread,
    UnprocessableThread,
)
from .....serializers import (
    ThreadSerializer,
    ThreadUrlPathsSerializer,
)


__all__ = ("ThreadsView",)


log = logging.getLogger("app.views.api.v1.reddit.thread")


@response_schema(serializer=ThreadSerializer(many=True))
class ThreadsView(CreateAPIView):
    queryset = Thread.objects.all()
    serializer_class = ThreadUrlPathsSerializer

    def create(self, request: Request, *args, **kwargs):
        submit_serializer = self.get_serializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)
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
        UnprocessableThread.objects.filter(created__lte=timezone.now() - config.UNPROCESSABLE_THREAD_EXP_TD).delete()
        unprocessable_urls = set(UnprocessableThread.objects.values_list("url", flat=True))

        llm_contributor = request.user
        nlp_contributor = User.objects.get(username="admin")

        if config.THREAD_PROCESSING_ENABLED:
            queue = django_rq.get_queue("default")
            for thread_url in set(thread_urls) - known_urls - fresh_urls - unprocessable_urls:
                queue.enqueue(
                    "app.worker.jobs.reddit.process_thread",
                    thread_url,
                    llm_contributor,
                    nlp_contributor,
                    job_id=thread_url,
                    result_ttl=0,
                )

        response_serializer = ThreadSerializer(instance=known_threads, many=True)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
