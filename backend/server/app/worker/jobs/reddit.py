import logging

from constance import config
from django.contrib.auth.models import User

from ...models import Producer
from ...services import (
    RedditorDataService,
    ThreadDataService,
)


log = logging.getLogger("app.worker.jobs.reddit")


def process_redditor(redditor_username: str, llm_contributor: User, nlp_contributor: User):
    service = RedditorDataService(redditor_username)
    llm_producer = Producer.objects.get(name=config.LLM_NAME)
    nlp_produced = Producer.objects.get(name=config.NLP_NAME)
    service.create(
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_produced,
    )


def process_thread(thread_url, llm_contributor: User, nlp_contributor: User):
    service = ThreadDataService(thread_url)
    llm_producer = Producer.objects.get(name=config.LLM_NAME)
    nlp_produced = Producer.objects.get(name=config.NLP_NAME)
    service.create(
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_produced,
    )
