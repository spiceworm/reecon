"""
Management command used to insert hardcoded values into the database.
This command should be idempotent.
"""

import decouple
from django.contrib.auth.models import User
from django.core import management

from ...models import (
    IgnoredRedditor,
    Producer,
    ProducerCategory,
)


def create_ignored_redditors():
    for username, reason in (("AutoModerator", "Bot"), ("VisualMod", "Bot")):
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


def create_producer_categories():
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


def create_producers():
    llm_category = ProducerCategory.objects.get(name="LLM")
    nlp_category = ProducerCategory.objects.get(name="NLP")

    for name, category, max_input_characters, description in (
        ("gpt-4o-2024-08-06", llm_category, 128_000, "https://platform.openai.com/docs/models/gpt-4o"),
        ("textblob", nlp_category, None, "https://textblob.readthedocs.io/en/dev/"),
    ):
        Producer.objects.update_or_create(
            name=name,
            defaults={
                "category": category,
                "description": description,
                "max_input_characters": max_input_characters,
            },
            create_defaults={
                "category": category,
                "description": description,
                "max_input_characters": max_input_characters,
                "name": name,
            },
        )


class Command(management.base.BaseCommand):
    def handle(self, *args, **options):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_user(
                username="admin",
                email=decouple.config("ADMIN_EMAIL"),
                password=decouple.config("ADMIN_PASSWORD"),
                is_superuser=True,
                is_staff=True,
            )

        create_ignored_redditors()
        create_producer_categories()
        create_producers()
