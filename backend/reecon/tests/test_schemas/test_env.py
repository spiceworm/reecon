import datetime as dt

from constance.test import override_config
from django.test import override_settings

from reecon.schemas import env


@override_settings(
    REDDIT_API_CLIENT_ID="client_id",
    REDDIT_API_CLIENT_SECRET="client_secret",
    REDDIT_API_RATELIMIT_SECONDS=60,
    REDDIT_API_USER_AGENT="user_agent",
)
@override_config(
    LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS=0.5,
    REDDITOR_ACCOUNT_MIN_AGE=30,
    REDDITOR_LLM_CONTEXT_QUERY_PROMPT="context query",
    REDDITOR_LLM_DATA_PROMPT="data process",
    REDDITOR_MIN_SUBMISSIONS=5,
    SUBMISSION_FILTER_MAX_LENGTH=100,
    SUBMISSION_FILTER_MIN_LENGTH=10,
    THREAD_LLM_CONTEXT_QUERY_PROMPT="thread context query",
    THREAD_LLM_DATA_PROMPT="thread data process",
    THREAD_MIN_SUBMISSIONS=5,
)
def test_get_worker_env():
    worker_env = env.get_worker_env()
    assert isinstance(worker_env, env.WorkerEnv)
    assert worker_env.reddit.api.client_id == "client_id"
    assert worker_env.reddit.api.client_secret == "client_secret"
    assert worker_env.reddit.api.ratelimit_seconds == 60
    assert worker_env.reddit.api.user_agent == "user_agent"
    assert worker_env.reddit.submission.max_length == 100
    assert worker_env.reddit.submission.min_length == 10
    assert worker_env.redditor.account.min_age == dt.timedelta(seconds=30)
    assert worker_env.redditor.llm.max_context_window_for_inputs == 0.5
    assert worker_env.redditor.llm.prompts.process_context_query == "context query"
    assert worker_env.redditor.llm.prompts.process_data == "data process"
    assert worker_env.redditor.submission.min_submissions == 5
    assert worker_env.thread.llm.max_context_window_for_inputs == 0.5
    assert worker_env.thread.llm.prompts.process_context_query == "thread context query"
    assert worker_env.thread.llm.prompts.process_data == "thread data process"
    assert worker_env.thread.submission.min_submissions == 5


def test_llm_env(llm_prompt_env_stub):
    llm_env = env.LlmEnv(prompts=llm_prompt_env_stub, max_context_window_for_inputs=0.5)
    assert llm_env.prompts is llm_prompt_env_stub
    assert llm_env.max_context_window_for_inputs == 0.5


def test_llm_prompt_env():
    llm_prompt_env = env.LlmPromptEnv(process_context_query="context query", process_data="data process")
    assert llm_prompt_env.process_context_query == "context query"
    assert llm_prompt_env.process_data == "data process"


def test_reddit_submission_env():
    reddit_submission_env = env.RedditSubmissionEnv(max_length=100, min_length=10)
    assert reddit_submission_env.max_length == 100
    assert reddit_submission_env.min_length == 10


def test_reddit_entity_submission_env():
    reddit_entity_submission_env = env.RedditEntitySubmissionEnv(min_submissions=5)
    assert reddit_entity_submission_env.min_submissions == 5


def test_reddit_api_env():
    reddit_api_env = env.RedditApiEnv(client_id="client_id", client_secret="client_secret", ratelimit_seconds=60, user_agent="user_agent")
    assert reddit_api_env.client_id == "client_id"
    assert reddit_api_env.client_secret == "client_secret"
    assert reddit_api_env.ratelimit_seconds == 60
    assert reddit_api_env.user_agent == "user_agent"


def test_reddit_env(reddit_api_env_stub, reddit_submission_env_stub):
    reddit_env = env.RedditEnv(api=reddit_api_env_stub, submission=reddit_submission_env_stub)
    assert reddit_env.api is reddit_api_env_stub
    assert reddit_env.submission is reddit_submission_env_stub


def test_redditor_account_env():
    redditor_account_env = env.RedditorAccountEnv(min_age=dt.timedelta(days=30))
    assert redditor_account_env.min_age == dt.timedelta(days=30)


def test_redditor_env(llm_env_stub, reddit_entity_submission_env_stub, redditor_account_env_stub):
    redditor_env = env.RedditorEnv(account=redditor_account_env_stub, llm=llm_env_stub, submission=reddit_entity_submission_env_stub)
    assert redditor_env.account is redditor_account_env_stub
    assert redditor_env.llm is llm_env_stub
    assert redditor_env.submission is reddit_entity_submission_env_stub


def test_thread_env(llm_env_stub, reddit_entity_submission_env_stub):
    thread_env = env.ThreadEnv(llm=llm_env_stub, submission=reddit_entity_submission_env_stub)
    assert thread_env.llm is llm_env_stub
    assert thread_env.submission is reddit_entity_submission_env_stub


def test_worker_env(reddit_env_stub, redditor_env_stub, thread_env_stub):
    worker_env = env.WorkerEnv(reddit=reddit_env_stub, redditor=redditor_env_stub, thread=thread_env_stub)
    assert worker_env.reddit is reddit_env_stub
    assert worker_env.redditor is redditor_env_stub
    assert worker_env.thread is thread_env_stub
