from datetime import timedelta
import logging

from django.utils import timezone
import django_rq
from django_rq.management.commands import rqscheduler

job_queue = django_rq.get_queue("high")
scheduler = django_rq.get_scheduler(queue=job_queue)
log = logging.getLogger(__name__)


def clear_scheduled_jobs():
    # Delete any existing jobs in the scheduler when the app starts up to prevent duplicate jobs
    for job in scheduler.get_jobs():
        log.debug("Deleting scheduled job %s", job)
        job.delete()

def register_scheduled_jobs():
    # Cannot have scheduled jobs start immediately because the database may not be ready immediately.
    start_time = timezone.now() + timedelta(seconds=10)

    scheduler.schedule(
        scheduled_time=start_time,
        func="app.scheduled_jobs.delete_unprocessable_redditors",
        interval=60 * 60,  # every hour
        repeat=None,
    )

    scheduler.schedule(
        scheduled_time=start_time,
        func="app.scheduled_jobs.delete_unprocessable_threads",
        interval=5 * 60,  # every 5 minutes
        repeat=None,
    )


class Command(rqscheduler.Command):
    def handle(self, *args, **kwargs):
        clear_scheduled_jobs()
        register_scheduled_jobs()
        super().handle(*args, **kwargs)
