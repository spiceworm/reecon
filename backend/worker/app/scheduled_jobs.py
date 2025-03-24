from constance import config
from django.utils import timezone

from reecon.models import (
    UnprocessableRedditor,
    UnprocessableThread,
)

__all__ = (
    "delete_unprocessable_redditors",
    "delete_unprocessable_threads",
)


def delete_unprocessable_redditors():
    return UnprocessableRedditor.objects.filter(created__lte=timezone.now() - config.UNPROCESSABLE_REDDITOR_EXP_TD).delete()


def delete_unprocessable_threads():
    return UnprocessableThread.objects.filter(created__lte=timezone.now() - config.UNPROCESSABLE_THREAD_EXP_TD).delete()
