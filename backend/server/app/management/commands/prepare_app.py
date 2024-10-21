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
from django.contrib.auth.models import User
from django.core import management
from django import db

from ...models import (
    IgnoredRedditor,
    Producer,
    ProducerCategory,
)


def create_hardcoded_ignored_redditors():
    for username, reason in (
        ("AutoModerator", "Bot"),
        ("coinfeeds-bot", "Bot"),
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
            "gpt-4o-2024-08-06",
            llm_category,
            128_000,
            "https://platform.openai.com/docs/models/gpt-4o",
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


def create_hardcoded_users():
    if not User.objects.filter(username="admin").exists():
        User.objects.create_user(
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

    def handle(self, *args, **options):
        if options["all"] or options["collectstatic"]:
            # Write static files to /static
            management.call_command("collectstatic", interactive=False)
        if options["all"] or options["generate_api_schema"]:
            # Generate API documentation schema (viewable to /api/v1/schema/{redoc,swagger-ui})
            management.call_command("spectacular", "--color", "--file=/static/schema.yml")
        if options["all"] or options["migrate"]:
            # Apply migrations to database after verifying that Django can connect to db
            for _ in range(5):
                try:
                    db.connection.cursor()
                except db.utils.OperationalError as e:
                    err = e
                    time.sleep(2)
                else:
                    management.call_command("migrate")
                    break
            else:
                raise err
        if options["all"] or options["populate-database"]:
            create_hardcoded_users()
            create_hardcoded_ignored_redditors()
            create_hardcoded_producer_categories()
            create_hardcoded_producers()
