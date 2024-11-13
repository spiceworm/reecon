import logging

from constance import config
from django.contrib.auth.models import User

from . import (
    models,
    services,
)


__all__ = (
    "process_redditor",
    "process_thread",
)


log = logging.getLogger("app.worker.jobs.reddit")


def process_redditor(redditor_username: str, llm_contributor: User, nlp_contributor: User, producer_settings: dict):
    llm_producer = models.Producer.objects.get(name=config.LLM_NAME)
    nlp_producer = models.Producer.objects.get(name=config.NLP_NAME)

    service = services.RedditorDataService(
        username=redditor_username,
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_producer,
    )
    return service.create(producer_settings=producer_settings)


def process_thread(thread_url: str, llm_contributor: User, nlp_contributor: User, producer_settings: dict):
    llm_producer = models.Producer.objects.get(name=config.LLM_NAME)
    nlp_producer = models.Producer.objects.get(name=config.NLP_NAME)

    service = services.ThreadDataService(
        url=thread_url,
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_producer,
    )
    return service.create(producer_settings=producer_settings)
