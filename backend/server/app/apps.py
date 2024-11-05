from django.apps import AppConfig


class MainConfig(AppConfig):
    name = "app"

    def ready(self):
        # signals.py can only be imported once the app is ready as it needs to import models that can only be imported
        # once the app is ready.
        from . import signals
