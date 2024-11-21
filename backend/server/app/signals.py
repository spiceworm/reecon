import logging

from constance.signals import config_updated
from django.dispatch import receiver

from reecon.models import StatusMessage


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
