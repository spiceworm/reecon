import time

from django.core import management
from django import db


class Command(management.base.BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--all", action="store_true")
        parser.add_argument("--collectstatic", action="store_true")
        parser.add_argument("--generate-api-schema", action="store_true")
        parser.add_argument("--migrate", action="store_true")

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
