import logging

from reecon import (
    exceptions,
    models,
    schemas,
    services,
    types,
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
    contributor: models.AppUser,
    llm: models.LLM,
    llm_providers_settings: types.LlmProvidersSettings,
    submitter: models.AppUser,
    env: schemas.WorkerEnv,
) -> models.UnprocessableRedditorContextQuery | None:
    """
    Returns an `UnprocessableRedditorContextQuery` object if the redditor_username cannot be processed in a
    context-query and None otherwise.
    """
    retval = None
    unprocessable_reason = ""

    try:
        ignored_redditor = models.IgnoredRedditor.objects.get(username=redditor_username)
    except models.IgnoredRedditor.DoesNotExist:
        obj: models.RedditorData | models.UnprocessableRedditor = _ensure_redditor_data(
            redditor_username=redditor_username,
            contributor=contributor,
            llm=llm,
            llm_providers_settings=llm_providers_settings,
            submitter=submitter,
            env=env,
        )
        if isinstance(obj, models.UnprocessableRedditor):
            unprocessable_reason = f"Cannot perform context query for {redditor_username}. Unprocessable: {obj.reason}"
    else:
        unprocessable_reason = f"Cannot perform context query for {redditor_username}. Ignored: {ignored_redditor.reason}"

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
        retval = unprocessable_obj
    return retval


def _ensure_redditor_data(
    *,
    redditor_username: str,
    contributor: models.AppUser,
    llm: models.LLM,
    llm_providers_settings: types.LlmProvidersSettings,
    submitter: models.AppUser,
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
            contributor=contributor,
            llm=llm,
            llm_providers_settings=llm_providers_settings,
            submitter=submitter,
            env=env,
        )
    else:
        return redditor.data.latest("created")


def _ensure_thread_context_query_processable(
    *,
    thread_path: str,
    contributor: models.AppUser,
    llm: models.LLM,
    llm_providers_settings: types.LlmProvidersSettings,
    submitter: models.AppUser,
    env: schemas.WorkerEnv,
) -> models.UnprocessableThreadContextQuery | None:
    """
    Returns an `UnprocessableThreadContextQuery` object if the thread_path cannot be processed in a
    context-query and None otherwise.
    """
    retval = None
    obj: models.ThreadData | models.UnprocessableThread = _ensure_thread_data(
        thread_path=thread_path,
        contributor=contributor,
        llm=llm,
        llm_providers_settings=llm_providers_settings,
        submitter=submitter,
        env=env,
    )
    if isinstance(obj, models.UnprocessableThread):
        reason = f"Cannot perform context query for {thread_path} because the thread is unprocessable. {obj.reason}"
        unprocessable_obj, _ = models.UnprocessableThreadContextQuery.objects.update_or_create(
            path=thread_path,
            defaults={
                "reason": reason,
                "submitter": submitter,
            },
            create_defaults={
                "path": thread_path,
                "reason": reason,
                "submitter": submitter,
            },
        )
        retval = unprocessable_obj
    return retval


def _ensure_thread_data(
    *,
    thread_path: str,
    contributor: models.AppUser,
    llm: models.LLM,
    llm_providers_settings: types.LlmProvidersSettings,
    submitter: models.AppUser,
    env: schemas.WorkerEnv,
) -> models.ThreadData | models.UnprocessableThread:
    """
    Verify that a `Thread` objects exists for `thread_path`. If no `Thread` matching `thread_path` exists, execute
    `process_thread_data`. `Thread` objects are created when `process_thread_data` executes without errors.
    """
    try:
        thread = models.Thread.objects.get(path=thread_path)
    except models.Thread.DoesNotExist:
        return process_thread_data(
            thread_path=thread_path,
            contributor=contributor,
            llm=llm,
            llm_providers_settings=llm_providers_settings,
            submitter=submitter,
            env=env,
        )
    else:
        return thread.data.latest("created")


def process_redditor_context_query(
    *,
    redditor_username: str,
    contributor: models.AppUser,
    context_query_llm: models.LLM,
    data_llm: models.LLM,
    llm_providers_settings: types.LlmProvidersSettings,
    submitter: models.AppUser,
    env: schemas.WorkerEnv,
) -> models.RedditorContextQuery | models.UnprocessableRedditorContextQuery:
    obj = _ensure_redditor_context_query_processable(
        redditor_username=redditor_username,
        contributor=contributor,
        llm=data_llm,
        llm_providers_settings=llm_providers_settings,
        submitter=submitter,
        env=env,
    )

    if isinstance(obj, models.UnprocessableRedditorContextQuery):
        return obj

    service = services.RedditorContextQueryService(
        identifier=redditor_username,
        contributor=contributor,
        llm=context_query_llm,
        llm_providers_settings=llm_providers_settings,
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
    contributor: models.AppUser,
    llm: models.LLM,
    llm_providers_settings: types.LlmProvidersSettings,
    submitter: models.AppUser,
    env: schemas.WorkerEnv,
) -> models.RedditorData | models.UnprocessableRedditor:
    service = services.RedditorDataService(
        identifier=redditor_username,
        contributor=contributor,
        llm=llm,
        llm_providers_settings=llm_providers_settings,
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
    thread_path: str,
    contributor: models.AppUser,
    context_query_llm: models.LLM,
    data_llm: models.LLM,
    llm_providers_settings: types.LlmProvidersSettings,
    submitter: models.AppUser,
    env: schemas.WorkerEnv,
) -> models.ThreadContextQuery | models.UnprocessableThreadContextQuery:
    obj = _ensure_thread_context_query_processable(
        thread_path=thread_path,
        contributor=contributor,
        llm=data_llm,
        llm_providers_settings=llm_providers_settings,
        submitter=submitter,
        env=env,
    )

    if isinstance(obj, models.UnprocessableThreadContextQuery):
        return obj

    service = services.ThreadContextQueryService(
        identifier=thread_path,
        contributor=contributor,
        llm=context_query_llm,
        llm_providers_settings=llm_providers_settings,
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
    thread_path: str,
    contributor: models.AppUser,
    llm: models.LLM,
    llm_providers_settings: types.LlmProvidersSettings,
    submitter: models.AppUser,
    env: schemas.WorkerEnv,
) -> models.ThreadData | models.UnprocessableThread:
    service = services.ThreadDataService(
        identifier=thread_path,
        contributor=contributor,
        llm=llm,
        llm_providers_settings=llm_providers_settings,
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
