import logging

from constance.signals import config_updated
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from reecon.models import (
    Profile,
    StatusMessage,
)


log = logging.getLogger("app.signals")


@receiver(config_updated)
def constance_updated(sender, key, old_value, new_value, **kwargs):
    match key:
        case "REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED":
            obj = StatusMessage.objects.get(name="redditorContextQueryProcessingDisabled")
            obj.active = not new_value
            obj.save()
            log.debug(f"StatusMessage({obj.name}).active updated to {obj.active}")
        case "REDDITOR_DATA_PROCESSING_ENABLED":
            obj = StatusMessage.objects.get(name="redditorDataProcessingDisabled")
            obj.active = not new_value
            obj.save()
            log.debug(f"StatusMessage({obj.name}).active updated to {obj.active}")
        case "THREAD_CONTEXT_QUERY_PROCESSING_ENABLED":
            obj = StatusMessage.objects.get(name="threadContextQueryProcessingDisabled")
            obj.active = not new_value
            obj.save()
            log.debug(f"StatusMessage({obj.name}).active updated to {obj.active}")
        case "THREAD_DATA_PROCESSING_ENABLED":
            obj = StatusMessage.objects.get(name="threadDataProcessingDisabled")
            obj.active = not new_value
            obj.save()
            log.debug(f"StatusMessage({obj.name}).active updated to {obj.active}")


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auth_user_saved(sender, instance, created, **kwargs):
    # When an instance of `settings.AUTH_USER_MODEL` is created, create a `Profile` instance to associate
    # with that auth user.
    if created:
        Profile.objects.create(user=instance)
