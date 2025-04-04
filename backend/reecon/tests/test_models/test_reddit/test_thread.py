import pytest
from django.utils.text import Truncator


@pytest.mark.django_db
class TestThread:
    def test_create(self, thread_cls):
        thread = thread_cls(path="/r/test/comments/asdf")
        assert thread.path == "/r/test/comments/asdf"
        assert thread.identifier == "/r/test/comments/asdf"
        assert thread.source == "https://old.reddit.com/r/test/comments/asdf"

    def test_str(self, thread_cls):
        thread = thread_cls(path="/r/test/comments/asdf")
        expected_str = f"Thread(last_processed={thread.last_processed}, path={thread.path})"
        assert str(thread) == expected_str


@pytest.mark.django_db
class TestThreadContextQuery:
    def test_create(self, thread_stub, thread_context_query_cls, request_metadata_stub):
        context_query = thread_context_query_cls(context=thread_stub, prompt="Test prompt", request_meta=request_metadata_stub, response="Test response")
        assert context_query.context is thread_stub
        assert context_query.prompt == "Test prompt"
        assert context_query.request_meta is request_metadata_stub
        assert context_query.response == "Test response"
        assert list(context_query.context.context_queries.all()) == [context_query]
        assert context_query.request_meta.threadcontextquery is context_query

    def test_str(self, thread_stub, thread_context_query_cls, request_metadata_stub):
        context_query = thread_context_query_cls(context=thread_stub, prompt="Test prompt", request_meta=request_metadata_stub, response="Test response")
        expected_str = (
            f"ThreadContextQuery(context={thread_stub.path}, prompt={Truncator(context_query.prompt).chars(100)}, response={Truncator(context_query.response).chars(100)})"
        )
        assert str(context_query) == expected_str


@pytest.mark.django_db
class TestThreadData:
    def test_create(self, request_metadata_stub, thread_stub, thread_data_cls):
        thread_data = thread_data_cls(
            thread=thread_stub,
            keywords=["test", "data"],
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.6,
            summary="A very informative thread.",
            request_meta=request_metadata_stub,
        )
        assert thread_data.thread is thread_stub
        assert thread_data.keywords == ["test", "data"]
        assert thread_data.request_meta is request_metadata_stub
        assert thread_data.sentiment_polarity == 0.5
        assert thread_data.sentiment_subjectivity == 0.6
        assert thread_data.summary == "A very informative thread."
        assert list(thread_data.thread.data.all()) == [thread_data]
        assert thread_data.request_meta.threaddata is thread_data

    def test_str(self, request_metadata_stub, thread_stub, thread_data_cls):
        thread_data = thread_data_cls(
            thread=thread_stub,
            keywords=["test", "data"],
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.6,
            summary="A very informative thread.",
            request_meta=request_metadata_stub,
        )
        expected_str = f"ThreadData(keywords={thread_data.keywords}, sentiment_polarity={thread_data.sentiment_polarity}, sentiment_subjectivity={thread_data.sentiment_subjectivity}, summary={Truncator(thread_data.summary).chars(100)}, thread={thread_stub.path})"
        assert str(thread_data) == expected_str


@pytest.mark.django_db
class TestUnprocessableThread:
    def test_create(self, unprocessable_thread_cls):
        unprocessable_thread = unprocessable_thread_cls(path="/r/test/comments/asdf", reason="not enough data")
        assert unprocessable_thread.path == "/r/test/comments/asdf"
        assert unprocessable_thread.reason == "not enough data"

    def test_str(self, unprocessable_thread_cls):
        unprocessable_thread = unprocessable_thread_cls(path="/r/test/comments/asdf", reason="not enough data")
        expected_str = f"UnprocessableThread(path={unprocessable_thread.path}, reason={unprocessable_thread.reason})"
        assert str(unprocessable_thread) == expected_str


@pytest.mark.django_db
class TestUnprocessableThreadContextQuery:
    def test_create(self, unprocessable_thread_context_query_cls):
        unprocessable_context_query = unprocessable_thread_context_query_cls(path="/r/test/comments/asdf", reason="not enough data")
        assert unprocessable_context_query.path == "/r/test/comments/asdf"
        assert unprocessable_context_query.reason == "not enough data"

    def test_str(self, unprocessable_thread_context_query_cls):
        unprocessable_context_query = unprocessable_thread_context_query_cls(path="/r/test/comments/asdf", reason="not enough data")
        expected_str = f"UnprocessableThreadContextQuery(path={unprocessable_context_query.path}, reason={unprocessable_context_query.reason})"
        assert str(unprocessable_context_query) == expected_str
