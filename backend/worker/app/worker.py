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


def _ensure_redditor_context_query_processable(
    *,
    redditor_username: str,
    llm_contributor: User,
    llm_producer: models.Producer,
    nlp_contributor: User,
    nlp_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
) -> models.UnprocessableRedditorContextQuery | None:
    """
    Returns an `UnprocessableRedditorContextQuery` object if the redditor_username cannot be processed in a
    context-query and None otherwise.
    """
    unprocessable_reason = ""

    try:
        ignored_redditor = models.IgnoredRedditor.objects.get(username=redditor_username)
    except models.IgnoredRedditor.DoesNotExist:
        obj: models.RedditorData | models.UnprocessableRedditor = _ensure_redditor_data(
            redditor_username=redditor_username,
            llm_contributor=llm_contributor,
            llm_producer=llm_producer,
            nlp_contributor=nlp_contributor,
            nlp_producer=nlp_producer,
            producer_settings=producer_settings,
            submitter=submitter,
            env=env,
        )
        if isinstance(obj, models.UnprocessableRedditor):
            unprocessable_reason = f"Cannot perform context query for {redditor_username}. Unprocessable: {obj.reason}"
    else:
        unprocessable_reason = (
            f"Cannot perform context query for {redditor_username}. Ignored: {ignored_redditor.reason}"
        )

    if unprocessable_reason:
        unprocessable_obj, _ = models.UnprocessableRedditorContextQuery.objects.update_or_create(
            username=redditor_username,
            defaults={
                "reason": unprocessable_reason,
                "submitter": submitter,
            },
            create_defaults={
                "reason": unprocessable_reason,
                "submitter": submitter,
                "username": redditor_username,
            },
        )
        return unprocessable_obj


def _ensure_redditor_data(
    *,
    redditor_username: str,
    llm_contributor: User,
    llm_producer: models.Producer,
    nlp_contributor: User,
    nlp_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
) -> models.RedditorData | models.UnprocessableRedditor:
    """
    Verify that a `Redditor` objects exists for `redditor_username`. If no `Redditor` matching `redditor_username`
    exists, execute `process_redditor_data`. `Redditor` objects are created when `process_redditor_data` executes
    without errors.
    """
    try:
        redditor = models.Redditor.objects.get(username=redditor_username)
    except models.Redditor.DoesNotExist:
        return process_redditor_data(
            redditor_username=redditor_username,
            llm_contributor=llm_contributor,
            llm_producer=llm_producer,
            nlp_contributor=nlp_contributor,
            nlp_producer=nlp_producer,
            producer_settings=producer_settings,
            submitter=submitter,
            env=env,
        )
    else:
        return redditor.data.latest("created")


def _ensure_thread_context_query_processable(
    *,
    thread_url: str,
    llm_contributor: User,
    llm_producer: models.Producer,
    nlp_contributor: User,
    nlp_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
) -> models.UnprocessableThreadContextQuery | None:
    """
    Returns an `UnprocessableThreadContextQuery` object if the thread_url cannot be processed in a
    context-query and None otherwise.
    """
    obj: models.ThreadData | models.UnprocessableThread = _ensure_thread_data(
        thread_url=thread_url,
        llm_contributor=llm_contributor,
        llm_producer=llm_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )
    if isinstance(obj, models.UnprocessableThread):
        reason = f"Cannot perform context query for {thread_url} because the thread is unprocessable. {obj.reason}"
        unprocessable_obj, _ = models.UnprocessableThreadContextQuery.objects.update_or_create(
            url=thread_url,
            defaults={
                "reason": reason,
                "submitter": submitter,
            },
            create_defaults={
                "reason": reason,
                "submitter": submitter,
                "url": thread_url,
            },
        )
        return unprocessable_obj


def _ensure_thread_data(
    *,
    thread_url: str,
    llm_contributor: User,
    llm_producer: models.Producer,
    nlp_contributor: User,
    nlp_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
) -> models.ThreadData | models.UnprocessableThread:
    """
    Verify that a `Thread` objects exists for `thread_url`. If no `Thread` matching `thread_url` exists, execute
    `process_thread_data`. `Thread` objects are created when `process_thread_data` executes without errors.
    """
    try:
        thread = models.Thread.objects.get(url=thread_url)
    except models.Thread.DoesNotExist:
        return process_thread_data(
            thread_url=thread_url,
            llm_contributor=llm_contributor,
            llm_producer=llm_producer,
            nlp_contributor=nlp_contributor,
            nlp_producer=nlp_producer,
            producer_settings=producer_settings,
            submitter=submitter,
            env=env,
        )
    else:
        return thread.data.latest("created")


def process_redditor_context_query(
    *,
    redditor_username: str,
    llm_contributor: User,
    llm_context_query_producer: models.Producer,
    llm_data_producer: models.Producer,
    nlp_contributor: User,
    nlp_context_query_producer: models.Producer,
    nlp_data_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
) -> models.RedditorContextQuery | models.UnprocessableRedditorContextQuery:
    obj = _ensure_redditor_context_query_processable(
        redditor_username=redditor_username,
        llm_contributor=llm_contributor,
        llm_producer=llm_data_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_data_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )

    if isinstance(obj, models.UnprocessableRedditorContextQuery):
        return obj

    service = services.RedditorContextQueryService(
        identifier=redditor_username,
        llm_contributor=llm_contributor,
        llm_producer=llm_context_query_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_context_query_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )

    # Do not need to catch `UnprocessableRedditorError` here because it would have already been thrown when
    # `_ensure_redditor_context_query_processable` was called above.
    inputs = service.get_inputs()
    generated = service.generate(inputs=inputs, prompt=env.redditor.llm.prompts.process_context_query)
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
) -> models.RedditorData | models.UnprocessableRedditor:
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
        log.debug(e)
        return e.obj
    else:
        generated = service.generate(inputs=inputs, prompt=env.redditor.llm.prompts.process_data)
        return service.create_object(generated=generated)


def process_thread_context_query(
    *,
    thread_url: str,
    llm_contributor: User,
    llm_context_query_producer: models.Producer,
    llm_data_producer: models.Producer,
    nlp_contributor: User,
    nlp_context_query_producer: models.Producer,
    nlp_data_producer: models.Producer,
    producer_settings: dict,
    submitter: User,
    env: schemas.WorkerEnv,
) -> models.ThreadContextQuery | models.UnprocessableThreadContextQuery:
    obj = _ensure_thread_context_query_processable(
        thread_url=thread_url,
        llm_contributor=llm_contributor,
        llm_producer=llm_data_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_data_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )

    if isinstance(obj, models.UnprocessableThreadContextQuery):
        return obj

    service = services.ThreadContextQueryService(
        identifier=thread_url,
        llm_contributor=llm_contributor,
        llm_producer=llm_context_query_producer,
        nlp_contributor=nlp_contributor,
        nlp_producer=nlp_context_query_producer,
        producer_settings=producer_settings,
        submitter=submitter,
        env=env,
    )

    # Do not need to catch `UnprocessableThreadError` here because it would have already been thrown when
    # `_ensure_thread_context_query_processable` was called above.
    inputs = service.get_inputs()
    generated = service.generate(inputs=inputs, prompt=env.thread.llm.prompts.process_context_query)
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
) -> models.ThreadData | models.UnprocessableThread:
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
        log.debug(e)
        return e.obj
    else:
        generated = service.generate(inputs=inputs, prompt=env.thread.llm.prompts.process_data)
        return service.create_object(generated=generated)
