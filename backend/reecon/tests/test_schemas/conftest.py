import datetime as dt

import pytest

from reecon.schemas import (
    env,
    reddit,
)


@pytest.fixture
def llm_env_stub(llm_prompt_env_stub):
    return env.LlmEnv(prompts=llm_prompt_env_stub, max_context_window_for_inputs=0.5)


@pytest.fixture
def llm_usage_metadata_stub():
    return reddit.LlmUsageMetadata(input_tokens=100, output_tokens=50, total_tokens=150)


@pytest.fixture
def llm_prompt_env_stub():
    return env.LlmPromptEnv(process_context_query="context query", process_data="data process")


@pytest.fixture
def reddit_api_env_stub():
    return env.RedditApiEnv(client_id="client_id", client_secret="client_secret", ratelimit_seconds=60, user_agent="user_agent")


@pytest.fixture
def reddit_entity_submission_env_stub():
    return env.RedditEntitySubmissionEnv(min_submissions=5)


@pytest.fixture
def reddit_env_stub(reddit_api_env_stub, reddit_submission_env_stub):
    return env.RedditEnv(api=reddit_api_env_stub, submission=reddit_submission_env_stub)


@pytest.fixture
def reddit_submission_env_stub():
    return env.RedditSubmissionEnv(max_length=100, min_length=10)


@pytest.fixture
def redditor_account_env_stub():
    return env.RedditorAccountEnv(min_age=dt.timedelta(days=30))


@pytest.fixture
def redditor_env_stub(llm_env_stub, reddit_entity_submission_env_stub, redditor_account_env_stub):
    return env.RedditorEnv(account=redditor_account_env_stub, llm=llm_env_stub, submission=reddit_entity_submission_env_stub)


@pytest.fixture
def thread_env_stub(llm_env_stub, reddit_entity_submission_env_stub):
    return env.ThreadEnv(llm=llm_env_stub, submission=reddit_entity_submission_env_stub)
