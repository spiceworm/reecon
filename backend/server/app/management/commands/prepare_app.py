"""
Custom management command that allows you to perform the following actions individually or all at once:
- collect static assets (written to /static)
- generate api schema (written to /static/schema.yml, required for swagger and redoc documentation endpoints)
- apply database migrations
- insert hardcoded values into the database (writes must be idempotent)

This is in a custom management command so that it can be run from entrypoint.sh and debug.sh
without having to list duplicate commands as everything is defined in one place.
"""

import time

import decouple
from django.contrib.auth import get_user_model
from django.core import management
from django import db

from reecon.models import (
    IgnoredRedditor,
    Producer,
    ProducerCategory,
    StatusMessage,
)


def create_hardcoded_ignored_redditors():
    # TODO: Read these from a file
    for username, reason in (
        ("AutoModerator", "Bot"),
        ("ccticker", "Bot"),
        ("coinfeeds-bot", "Bot"),
        ("ethfinance", "Bot"),
        ("VisualMod", "Bot"),
    ):
        IgnoredRedditor.objects.update_or_create(
            username=username,
            defaults={
                "reason": reason,
            },
            create_defaults={
                "username": username,
                "reason": reason,
            },
        )


def create_hardcoded_producer_categories():
    for name, description in (
        ("LLM", "Large language model"),
        ("NLP", "Natural language processing"),
    ):
        ProducerCategory.objects.update_or_create(
            name=name,
            defaults={
                "description": description,
            },
            create_defaults={
                "description": description,
                "name": name,
            },
        )


def create_hardcoded_producers():
    llm_category = ProducerCategory.objects.get(name="LLM")
    nlp_category = ProducerCategory.objects.get(name="NLP")

    for name, category, context_window, description in (
        (
            "gpt-4o-mini-2024-07-18",
            llm_category,
            128_000,
            "https://platform.openai.com/docs/models/gpt-4o-mini",
        ),
        (
            "gpt-4o-2024-08-06",
            llm_category,
            128_000,
            "https://platform.openai.com/docs/models/gpt-4o",
        ),
        (
            "o3-mini-2025-01-31",
            llm_category,
            200_000,
            "https://platform.openai.com/docs/models/o3-mini",
        ),
        ("textblob", nlp_category, None, "https://textblob.readthedocs.io/en/dev/"),
    ):
        Producer.objects.update_or_create(
            name=name,
            defaults={
                "category": category,
                "description": description,
                "context_window": context_window,
            },
            create_defaults={
                "category": category,
                "description": description,
                "context_window": context_window,
                "name": name,
            },
        )


def create_hardcoded_status_messages():
    for active, active_is_computed, name, category, message in [
        (
            True,
            True,
            "redditorContextQueryProcessingDisabled",
            "warning",
            "Redditor context query processing disabled for all users",
        ),
        (
            True,
            True,
            "redditorDataProcessingDisabled",
            "warning",
            "Redditor data processing disabled for all users",
        ),
        (
            True,
            True,
            "threadContextQueryProcessingDisabled",
            "warning",
            "Thread context query processing disabled for all users",
        ),
        (
            True,
            True,
            "threadDataProcessingDisabled",
            "warning",
            "Thread data processing disabled for all users",
        ),
    ]:
        StatusMessage.objects.update_or_create(
            name=name,
            defaults={
                "active_is_computed": active_is_computed,
                "category": category,
                "message": message,
            },
            create_defaults={
                "active": active,
                "active_is_computed": active_is_computed,
                "category": category,
                "message": message,
                "name": name,
            },
        )


def create_hardcoded_users():
    user_model = get_user_model()

    try:
        user_model.objects.get(username="admin")
    except user_model.DoesNotExist:
        user_model.objects.create_user(
            username="admin",
            password=decouple.config("ADMIN_PASSWORD"),
            is_superuser=True,
            is_staff=True,
        )


class Command(management.base.BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--all", action="store_true")
        parser.add_argument("--collectstatic", action="store_true")
        parser.add_argument("--generate-api-schema", action="store_true")
        parser.add_argument("--migrate", action="store_true")
        parser.add_argument("--populate-database", action="store_true")

    def ensure_db_connection(self):
        for _ in range(5):
            try:
                db.connection.cursor()
            except db.utils.OperationalError as e:
                err = e
                time.sleep(2)
            else:
                break
        else:
            raise err

    # TODO: `--collectstatic` and `--generate-api-schema` are needed for the server container to serve drf ui and docs.
    #     `--migrate` and `--populate-database` should be called only from the service container. The problem is that
    #     a bunch of installed apps, middleware, and requirements need to be present in the service container to create
    #     django tables and tables required for some dependencies.
    def handle(self, *args, **options):
        if options["all"] or options["collectstatic"]:
            # Write static files to /static
            management.call_command("collectstatic", interactive=False)
        if options["all"] or options["migrate"]:
            self.ensure_db_connection()
            management.call_command("migrate")
        if options["all"] or options["populate_database"]:
            self.ensure_db_connection()
            create_hardcoded_users()
            create_hardcoded_ignored_redditors()
            create_hardcoded_producer_categories()
            create_hardcoded_producers()
            create_hardcoded_status_messages()
        if options["all"] or options["generate_api_schema"]:
            # Generate API documentation schema (viewable to /api/v1/schema/{redoc,swagger-ui})
            management.call_command("spectacular", "--color", "--file=/static/schema.yml")
