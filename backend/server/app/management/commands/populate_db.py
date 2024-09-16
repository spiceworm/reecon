"""
Management command used to insert hardcoded values into the database.
"""

import decouple
from django.contrib.auth.models import User
from django.core import management

from ...models import (
    Creator,
    LLM,
)


class Command(management.base.BaseCommand):
    def handle(self, *args, **options):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_user(
                username="admin",
                email=decouple.config('ADMIN_EMAIL'),
                password=decouple.config('ADMIN_PASSWORD'),
                is_superuser=True,
                is_staff=True,
            )

        creator, _ = Creator.objects.update_or_create(name="OpenAI", defaults={}, create_defaults={"name": "OpenAI"})

        for model_name, context_window in (("chatgpt-4o-latest", 128_000),):
            LLM.objects.update_or_create(
                name=model_name,
                defaults={
                    "context_window": context_window,
                    "creator": creator,
                },
                create_defaults={
                    "context_window": context_window,
                    "creator": creator,
                    "name": model_name,
                },
            )
