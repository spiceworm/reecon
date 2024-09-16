import logging

from ...services import (
    RedditorService,
    ThreadService,
)


log = logging.getLogger("app.worker.jobs.reddit")


def process_redditor(redditor_username: str, purchaser_username: str):
    service = RedditorService(redditor_username)
    service.process(purchaser_username)


def process_thread(url):
    service = ThreadService(url)
    service.process()
