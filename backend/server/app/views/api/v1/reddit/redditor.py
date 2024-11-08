import logging

from constance import config
from django.contrib.auth.models import User
from django.utils import timezone
import django_rq
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response

from .....models import (
    Redditor,
    IgnoredRedditor,
    UnprocessableRedditor,
)
from .....serializers import (
    RedditorRequestSerializer,
    RedditorResponseSerializer,
)
from .....worker import jobs


__all__ = ("RedditorsView",)


log = logging.getLogger("app.views.api.v1.reddit.redditor")


@extend_schema(responses=RedditorResponseSerializer())
class RedditorsView(CreateAPIView):
    queryset = Redditor.objects.all()
    serializer_class = RedditorRequestSerializer

    def create(self, request, *args, **kwargs):
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
        UnprocessableRedditor.objects.filter(
            created__lte=timezone.now() - config.UNPROCESSABLE_REDDITOR_EXP_TD
        ).delete()

        unprocessable_redditors = UnprocessableRedditor.objects.filter(username__in=usernames)
        unprocessable_usernames = {redditor.username for redditor in unprocessable_redditors}

        # TODO: clients should have a list of ignored usernames so they never get submit for processing
        ignored_redditors = IgnoredRedditor.objects.filter(username__in=usernames)
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
                    jobs.process_redditor,
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

        response_serializer = RedditorResponseSerializer(instance=data)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
