import pytest

from reecon.schemas import reddit


class TestGeneratedContextQuery:
    def test_create(self, usage_metadata):
        generated_context_query = reddit.GeneratedContextQuery(response="Test response", usage_metadata=usage_metadata)
        assert generated_context_query.response == "Test response"
        assert generated_context_query.usage_metadata == usage_metadata


class TestGeneratedData:
    def test_create(self, usage_metadata):
        generated_data = reddit.GeneratedData(
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=usage_metadata,
        )
        assert generated_data.sentiment_polarity == 0.5
        assert generated_data.sentiment_subjectivity == 0.5
        assert generated_data.summary == "Test summary"
        assert generated_data.usage_metadata == usage_metadata

    def test_invalid_sentiment_polarity(self, usage_metadata):
        with pytest.raises(ValueError, match="sentiment_polarity must be between -1.0 and 1.0"):
            reddit.GeneratedData(
                sentiment_polarity=2.0,
                sentiment_subjectivity=0.5,
                summary="Test summary",
                usage_metadata=usage_metadata,
            )

    def test_invalid_sentiment_subjectivity(self, usage_metadata):
        with pytest.raises(ValueError, match="sentiment_subjectivity must be between 0.0 and 1.0"):
            reddit.GeneratedData(
                sentiment_polarity=0.5,
                sentiment_subjectivity=1.5,
                summary="Test summary",
                usage_metadata=usage_metadata,
            )


class TestGeneratedRedditorContextQuery:
    def test_create(self, usage_metadata):
        generated_redditor_context_query = reddit.GeneratedRedditorContextQuery(response="Test response", usage_metadata=usage_metadata)
        assert generated_redditor_context_query.response == "Test response"
        assert generated_redditor_context_query.usage_metadata == usage_metadata


class TestGeneratedRedditorContextQueryWithContext:
    def test_create(self, comment_submission, usage_metadata):
        generated_redditor_context_query = reddit.GeneratedRedditorContextQueryWithContext(
            inputs=[comment_submission(text="input1"), comment_submission(text="input2")],
            prompt="Test prompt",
            response="Test response",
            usage_metadata=usage_metadata,
        )
        assert generated_redditor_context_query.inputs == [comment_submission(text="input1"), comment_submission(text="input2")]
        assert generated_redditor_context_query.prompt == "Test prompt"


class TestGeneratedRedditorData:
    def test_create(self, usage_metadata):
        generated_redditor_data = reddit.GeneratedRedditorData(
            age=25,
            interests=["interest1", "interest2"],
            iq=120,
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=usage_metadata,
        )
        assert generated_redditor_data.age == 25
        assert generated_redditor_data.interests == ["interest1", "interest2"]
        assert generated_redditor_data.iq == 120
        assert generated_redditor_data.sentiment_polarity == 0.5
        assert generated_redditor_data.sentiment_subjectivity == 0.5
        assert generated_redditor_data.summary == "Test summary"
        assert generated_redditor_data.usage_metadata == usage_metadata

    def test_normalize_interests(self, usage_metadata):
        generated_redditor_data = reddit.GeneratedRedditorData(
            age=25,
            interests=["INTEREST1", "interest2"],
            iq=120,
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=usage_metadata,
        )
        assert generated_redditor_data.normalized_interests() == ["interest1", "interest2"]


class TestGeneratedRedditorDataWithContext:
    def test_create(self, comment_submission, usage_metadata):
        generated_redditor_data = reddit.GeneratedRedditorDataWithContext(
            age=25,
            inputs=[comment_submission(text="input1"), comment_submission(text="input2")],
            interests=["interest1", "interest2"],
            iq=120,
            prompt="Test prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=usage_metadata,
        )
        assert generated_redditor_data.inputs == [comment_submission(text="input1"), comment_submission(text="input2")]
        assert generated_redditor_data.prompt == "Test prompt"


class TestGeneratedThreadContextQuery:
    def test_create(self, usage_metadata):
        generated_thread_context_query = reddit.GeneratedThreadContextQuery(response="Test response", usage_metadata=usage_metadata)
        assert generated_thread_context_query.response == "Test response"
        assert generated_thread_context_query.usage_metadata == usage_metadata


class TestGeneratedThreadContextQueryWithContext:
    def test_create(self, comment_submission, usage_metadata):
        generated_thread_context_query = reddit.GeneratedThreadContextQueryWithContext(
            inputs=[comment_submission(text="input1"), comment_submission(text="input2")],
            prompt="Test prompt",
            response="Test response",
            usage_metadata=usage_metadata,
        )
        assert generated_thread_context_query.inputs == [comment_submission(text="input1"), comment_submission(text="input2")]
        assert generated_thread_context_query.prompt == "Test prompt"


class TestGeneratedThreadData:
    def test_create(self, usage_metadata):
        generated_thread_data = reddit.GeneratedThreadData(
            keywords=["keyword1", "keyword2"],
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=usage_metadata,
        )
        assert generated_thread_data.keywords == ["keyword1", "keyword2"]
        assert generated_thread_data.sentiment_polarity == 0.5
        assert generated_thread_data.sentiment_subjectivity == 0.5
        assert generated_thread_data.summary == "Test summary"
        assert generated_thread_data.usage_metadata == usage_metadata

    def test_normalize_keywords(self, usage_metadata):
        generated_thread_data = reddit.GeneratedThreadData(
            keywords=["KEYWORD1", "keyword2"],
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=usage_metadata,
        )
        assert generated_thread_data.normalized_keywords() == ["keyword1", "keyword2"]


class TestGeneratedThreadDataWithContext:
    def test_create(self, comment_submission, usage_metadata):
        generated_thread_data = reddit.GeneratedThreadDataWithContext(
            inputs=[comment_submission(text="input1"), comment_submission(text="input2")],
            keywords=["keyword1", "keyword2"],
            prompt="Test prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata=usage_metadata,
        )
        assert generated_thread_data.inputs == [comment_submission(text="input1"), comment_submission(text="input2")]
        assert generated_thread_data.prompt == "Test prompt"
