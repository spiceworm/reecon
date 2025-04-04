import pytest

from reecon.schemas import reddit


def test_llm_usage_metadata():
    llm_usage_metadata = reddit.LlmUsageMetadata(input_tokens=100, output_tokens=50, total_tokens=150)
    assert llm_usage_metadata.input_tokens == 100
    assert llm_usage_metadata.output_tokens == 50
    assert llm_usage_metadata.total_tokens == 150


def test_llm_response(llm_usage_metadata_stub):
    llm_response = reddit.LlmResponse(usage_metadata=llm_usage_metadata_stub)
    assert llm_response.usage_metadata is llm_usage_metadata_stub


def test_generated_context_query(llm_usage_metadata_stub):
    generated_context_query = reddit.GeneratedContextQuery(
        inputs=["input1", "input2"],
        prompt="Test prompt",
        response="Test response",
        usage_metadata=llm_usage_metadata_stub,
    )
    assert generated_context_query.inputs == ["input1", "input2"]
    assert generated_context_query.prompt == "Test prompt"
    assert generated_context_query.response == "Test response"
    assert generated_context_query.usage_metadata is llm_usage_metadata_stub


def test_generated_redditor_context_query(llm_usage_metadata_stub):
    generated_redditor_context_query = reddit.GeneratedRedditorContextQuery(
        inputs=["input1", "input2"],
        prompt="Test prompt",
        response="Test response",
        usage_metadata=llm_usage_metadata_stub,
    )
    assert generated_redditor_context_query.inputs == ["input1", "input2"]
    assert generated_redditor_context_query.prompt == "Test prompt"
    assert generated_redditor_context_query.response == "Test response"
    assert generated_redditor_context_query.usage_metadata is llm_usage_metadata_stub


def test_generated_thread_context_query(llm_usage_metadata_stub):
    generated_thread_context_query = reddit.GeneratedThreadContextQuery(
        inputs=["input1", "input2"],
        prompt="Test prompt",
        response="Test response",
        usage_metadata=llm_usage_metadata_stub,
    )
    assert generated_thread_context_query.inputs == ["input1", "input2"]
    assert generated_thread_context_query.prompt == "Test prompt"
    assert generated_thread_context_query.response == "Test response"
    assert generated_thread_context_query.usage_metadata is llm_usage_metadata_stub


class TestGeneratedData:
    def test_create(self, llm_usage_metadata_stub):
        generated_data = reddit.GeneratedData(
            inputs=["input1", "input2"],
            prompt="Test prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=llm_usage_metadata_stub,
        )
        assert generated_data.inputs == ["input1", "input2"]
        assert generated_data.prompt == "Test prompt"
        assert generated_data.sentiment_polarity == 0.5
        assert generated_data.sentiment_subjectivity == 0.5
        assert generated_data.summary == "Test summary"
        assert generated_data.usage_metadata is llm_usage_metadata_stub

    def test_invalid_sentiment_polarity(self, llm_usage_metadata_stub):
        with pytest.raises(ValueError, match="sentiment_polarity must be between -1.0 and 1.0"):
            reddit.GeneratedData(
                inputs=["input1", "input2"],
                prompt="Test prompt",
                sentiment_polarity=2.0,
                sentiment_subjectivity=0.5,
                summary="Test summary",
                usage_metadata=llm_usage_metadata_stub,
            )

    def test_invalid_sentiment_subjectivity(self, llm_usage_metadata_stub):
        with pytest.raises(ValueError, match="sentiment_subjectivity must be between 0.0 and 1.0"):
            reddit.GeneratedData(
                inputs=["input1", "input2"],
                prompt="Test prompt",
                sentiment_polarity=0.5,
                sentiment_subjectivity=1.5,
                summary="Test summary",
                usage_metadata=llm_usage_metadata_stub,
            )


class TestGeneratedRedditorData:
    def test_create(self, llm_usage_metadata_stub):
        generated_redditor_data = reddit.GeneratedRedditorData(
            age=25,
            inputs=["input1", "input2"],
            interests=["interest1", "interest2"],
            iq=120,
            prompt="Test prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=llm_usage_metadata_stub,
        )
        assert generated_redditor_data.age == 25
        assert generated_redditor_data.inputs == ["input1", "input2"]
        assert generated_redditor_data.interests == ["interest1", "interest2"]
        assert generated_redditor_data.iq == 120
        assert generated_redditor_data.prompt == "Test prompt"
        assert generated_redditor_data.sentiment_polarity == 0.5
        assert generated_redditor_data.sentiment_subjectivity == 0.5
        assert generated_redditor_data.summary == "Test summary"
        assert generated_redditor_data.usage_metadata is llm_usage_metadata_stub

    def test_normalize_interests(self, llm_usage_metadata_stub):
        generated_redditor_data = reddit.GeneratedRedditorData(
            age=25,
            inputs=["input1", "input2"],
            interests=["INTEREST1", "interest2"],
            iq=120,
            prompt="Test prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=llm_usage_metadata_stub,
        )
        assert generated_redditor_data.normalized_interests() == ["interest1", "interest2"]


class TestGeneratedThreadData:
    def test_create(self, llm_usage_metadata_stub):
        generated_thread_data = reddit.GeneratedThreadData(
            inputs=["input1", "input2"],
            keywords=["keyword1", "keyword2"],
            prompt="Test prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=llm_usage_metadata_stub,
        )
        assert generated_thread_data.inputs == ["input1", "input2"]
        assert generated_thread_data.keywords == ["keyword1", "keyword2"]
        assert generated_thread_data.prompt == "Test prompt"
        assert generated_thread_data.sentiment_polarity == 0.5
        assert generated_thread_data.sentiment_subjectivity == 0.5
        assert generated_thread_data.summary == "Test summary"
        assert generated_thread_data.usage_metadata is llm_usage_metadata_stub

    def test_normalize_keywords(self, llm_usage_metadata_stub):
        generated_thread_data = reddit.GeneratedThreadData(
            inputs=["input1", "input2"],
            keywords=["KEYWORD1", "keyword2"],
            prompt="Test prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=llm_usage_metadata_stub,
        )
        assert generated_thread_data.normalized_keywords() == ["keyword1", "keyword2"]
