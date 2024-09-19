import logging

from constance import config
from django.contrib.auth.models import User
from django.utils import timezone
import django_rq
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response

from ..util import response_schema
from .....models import (
    Redditor,
    IgnoredRedditor,
    UnprocessableRedditor,
)
from .....serializers import (
    RedditorSerializer,
    RedditorUsernameSerializer,
)


__all__ = ("RedditorsView",)


log = logging.getLogger("app.views.api.v1.reddit.redditor")


@response_schema(serializer=RedditorSerializer(many=True))
class RedditorsView(CreateAPIView):
    queryset = Redditor.objects.all()
    serializer_class = RedditorUsernameSerializer

    def create(self, request, *args, **kwargs):
        submit_serializer = self.get_serializer(data=request.data)
        submit_serializer.is_valid(raise_exception=True)
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
        UnprocessableRedditor.objects.filter(
            created__lte=timezone.now() - config.UNPROCESSABLE_REDDITOR_EXP_TD
        ).delete()
        unprocessable_usernames = {redditor.username for redditor in UnprocessableRedditor.objects.only("username")}
        # TODO: clients should have a list of ignored usernames so they never get submit for processing
        ignored_usernames = set(IgnoredRedditor.objects.values_list("username", flat=True))

        llm_contributor = request.user
        nlp_contributor = User.objects.get(username="admin")

        if config.REDDITOR_PROCESSING_ENABLED:
            queue = django_rq.get_queue("default")
            for redditor_username in (
                set(usernames) - known_usernames - fresh_usernames - unprocessable_usernames - ignored_usernames
            ):
                queue.enqueue(
                    "app.worker.jobs.reddit.process_redditor",
                    redditor_username,
                    llm_contributor,
                    nlp_contributor,
                    job_id=redditor_username,
                    result_ttl=0,
                )

        response_serializer = RedditorSerializer(instance=known_redditors, many=True)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
