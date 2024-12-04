import logging

from django.contrib.auth.models import User

from reecon import (
    exceptions,
    models,
    schemas,
    services,
)


__all__ = (
    "process_redditor_context_query",
    "process_redditor_data",
    "process_thread_context_query",
    "process_thread_data",
)


log = logging.getLogger("app.worker.jobs.reddit")


def process_redditor_context_query(
    *,
    redditor_username: str,
    llm_contributor: User,
    llm_producer: models.Producer,
    nlp_contributor: User,
    nlp_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
):
    service = services.RedditorContextQueryService(
        identifier=redditor_username,
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )

    try:
        inputs = service.get_inputs()
    except exceptions.UnprocessableRedditorError as e:
        log.info(e)
    else:
        prompt = f"{env.redditor.llm.prompt_prefix} {env.redditor.llm.prompt}"
        generated = service.generate(inputs=inputs, prompt=prompt)
        return service.create_object(generated=generated)


def process_redditor_data(
    *,
    redditor_username: str,
    llm_contributor: User,
    llm_producer: models.Producer,
    nlp_contributor: User,
    nlp_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
):
    service = services.RedditorDataService(
        identifier=redditor_username,
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )

    try:
        inputs = service.get_inputs()
    except exceptions.UnprocessableRedditorError as e:
        log.info(e)
    else:
        prompt = f"{env.redditor.llm.prompt_prefix} {env.redditor.llm.prompt}"
        generated = service.generate(inputs=inputs, prompt=prompt)
        return service.create_object(generated=generated)


def process_thread_context_query(
    *,
    thread_url: str,
    llm_contributor: User,
    llm_producer: models.Producer,
    nlp_contributor: User,
    nlp_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
):
    service = services.ThreadContextQueryService(
        identifier=thread_url,
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )

    try:
        inputs = service.get_inputs()
    except exceptions.UnprocessableThreadError as e:
        log.info(e)
    else:
        prompt = f"{env.thread.llm.prompt_prefix} {env.thread.llm.prompt}"
        generated = service.generate(inputs=inputs, prompt=prompt)
        return service.create_object(generated=generated)


def process_thread_data(
    *,
    thread_url: str,
    llm_contributor: User,
    llm_producer: models.Producer,
    nlp_contributor: User,
    nlp_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
):
    service = services.ThreadDataService(
        identifier=thread_url,
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )

    try:
        inputs = service.get_inputs()
    except exceptions.UnprocessableThreadError as e:
        log.info(e)
    else:
        prompt = f"{env.thread.llm.prompt_prefix} {env.thread.llm.prompt}"
        generated = service.generate(inputs=inputs, prompt=prompt)
        return service.create_object(generated=generated)
