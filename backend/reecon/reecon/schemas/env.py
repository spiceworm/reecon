from pydantic import Field
from pydantic.dataclasses import dataclass


__all__ = ("get_worker_env", "WorkerEnv")


@dataclass
class LlmEnv:
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
    password: str
    ratelimit_seconds: int
    user_agent: str
    username: str


@dataclass
class RedditEnv:
    api: RedditApiEnv
    submission: RedditSubmissionEnv


@dataclass
class RedditorEnv:
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
                password=settings.REDDIT_API_PASSWORD,
                ratelimit_seconds=settings.REDDIT_API_RATELIMIT_SECONDS,
                user_agent=settings.REDDIT_API_USER_AGENT,
                username=settings.REDDIT_API_USERNAME,
            ),
            submission=RedditSubmissionEnv(
                max_length=config.SUBMISSION_FILTER_MAX_LENGTH,
                min_length=config.SUBMISSION_FILTER_MIN_LENGTH,
            ),
        ),
        redditor=RedditorEnv(
            llm=LlmEnv(
                max_context_window_for_inputs=config.LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS,
                prompt=config.REDDITOR_LLM_PROMPT,
            ),
            submission=RedditEntitySubmissionEnv(
                min_submissions=config.REDDITOR_MIN_SUBMISSIONS,
            ),
        ),
        thread=ThreadEnv(
            llm=LlmEnv(
                max_context_window_for_inputs=config.LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS,
                prompt=config.THREAD_LLM_PROMPT,
            ),
            submission=RedditEntitySubmissionEnv(
                min_submissions=config.THREAD_MIN_SUBMISSIONS,
            ),
        ),
    )
