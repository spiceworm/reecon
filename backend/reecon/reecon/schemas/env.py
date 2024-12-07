import datetime as dt

from pydantic import Field
from pydantic.dataclasses import dataclass


__all__ = ("get_worker_env", "WorkerEnv")


@dataclass
class LlmEnv:
    default_context_query_prompt: str
    default_data_prompt: str
    prompt: str
    max_context_window_for_inputs: float = Field(
        ge=0.0,
        le=1.0,
    )


@dataclass
class RedditSubmissionEnv:
    max_length: int
    min_length: int


@dataclass
class RedditEntitySubmissionEnv:
    min_submissions: int


@dataclass
class RedditApiEnv:
    client_id: str
    client_secret: str
    ratelimit_seconds: int
    user_agent: str


@dataclass
class RedditEnv:
    api: RedditApiEnv
    submission: RedditSubmissionEnv


@dataclass
class RedditorAccountEnv:
    min_age: dt.timedelta


@dataclass
class RedditorEnv:
    account: RedditorAccountEnv
    llm: LlmEnv
    submission: RedditEntitySubmissionEnv


@dataclass
class ThreadEnv:
    llm: LlmEnv
    submission: RedditEntitySubmissionEnv


@dataclass
class WorkerEnv:
    reddit: RedditEnv
    redditor: RedditorEnv
    thread: ThreadEnv


def get_worker_env():
    """
    This should only be called from the web app when enqueuing jobs that will be processed by the worker.
    The worker will not have access to constance or django variables so they need to be passed in as an
    argument.
    """
    from constance import config
    from django.conf import settings

    return WorkerEnv(
        reddit=RedditEnv(
            api=RedditApiEnv(
                client_id=settings.REDDIT_API_CLIENT_ID,
                client_secret=settings.REDDIT_API_CLIENT_SECRET,
                ratelimit_seconds=settings.REDDIT_API_RATELIMIT_SECONDS,
                user_agent=settings.REDDIT_API_USER_AGENT,
            ),
            submission=RedditSubmissionEnv(
                max_length=config.SUBMISSION_FILTER_MAX_LENGTH,
                min_length=config.SUBMISSION_FILTER_MIN_LENGTH,
            ),
        ),
        redditor=RedditorEnv(
            account=RedditorAccountEnv(
                min_age=config.REDDITOR_ACCOUNT_MIN_AGE,
            ),
            llm=LlmEnv(
                max_context_window_for_inputs=config.LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS,
                default_context_query_prompt=config.REDDITOR_LLM_CONTEXT_QUERY_PROMPT,
                default_data_prompt=config.REDDITOR_LLM_DATA_PROMPT,
                # `prompt` will be set in the redditor context-query and data API views. This is because
                # for context-queries, the form submit by the user is pre-populated with the value of
                # REDDITOR_LLM_CONTEXT_QUERY_PROMPT. The user can then modify that value before submitting the
                # query for processing. The redditor data API view sets the `prompt` value in the same way for
                # consistency even though the value is not dynamic like it is for context-queries.
                prompt="",
            ),
            submission=RedditEntitySubmissionEnv(
                min_submissions=config.REDDITOR_MIN_SUBMISSIONS,
            ),
        ),
        thread=ThreadEnv(
            llm=LlmEnv(
                max_context_window_for_inputs=config.LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS,
                default_context_query_prompt=config.THREAD_LLM_CONTEXT_QUERY_PROMPT,
                default_data_prompt=config.THREAD_LLM_DATA_PROMPT,
                # `prompt` will be set in the thread context-query and data API views. This is because
                # for context-queries, the form submit by the user is pre-populated with the value of
                # THREAD_LLM_CONTEXT_QUERY_PROMPT. The user can then modify that value before submitting the
                # query for processing. The thread data API view sets the `prompt` value in the same way for
                # consistency even though the value is not dynamic like it is for context-queries.
                prompt="",
            ),
            submission=RedditEntitySubmissionEnv(
                min_submissions=config.THREAD_MIN_SUBMISSIONS,
            ),
        ),
    )
