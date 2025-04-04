import pytest
from django.utils import timezone
from django.utils.text import Truncator


@pytest.mark.django_db
class TestIgnoredRedditor:
    def test_create(self, ignored_redditor_cls):
        ignored_redditor = ignored_redditor_cls(username="testuser", reason="spam")
        assert ignored_redditor.username == "testuser"
        assert ignored_redditor.reason == "spam"

    def test_str(self, ignored_redditor_cls):
        ignored_redditor = ignored_redditor_cls(username="testuser", reason="spam")
        expected_str = f"IgnoredRedditor(reason={ignored_redditor.reason}, username={ignored_redditor.username})"
        assert str(ignored_redditor) == expected_str


@pytest.mark.django_db
class TestRedditor:
    def test_create(self, redditor_cls):
        redditor = redditor_cls(username="testuser", last_processed=timezone.now())
        assert redditor.username == "testuser"
        assert redditor.identifier == "testuser"
        assert redditor.source == "https://old.reddit.com/user/testuser"

    def test_str(self, redditor_cls):
        redditor = redditor_cls(username="testuser", last_processed=timezone.now())
        expected_str = f"Redditor(last_processed={redditor.last_processed}, username={redditor.username})"
        assert str(redditor) == expected_str


@pytest.mark.django_db
class TestRedditorContextQuery:
    def test_create(self, redditor_stub, redditor_context_query_cls, request_metadata_stub):
        context_query = redditor_context_query_cls(
            context=redditor_stub, prompt="What is the weather like?", request_meta=request_metadata_stub, response="The weather is sunny."
        )
        assert context_query.context is redditor_stub
        assert context_query.prompt == "What is the weather like?"
        assert context_query.request_meta is request_metadata_stub
        assert context_query.response == "The weather is sunny."
        assert list(context_query.context.context_queries.all()) == [context_query]
        assert context_query.request_meta.redditorcontextquery is context_query

    def test_str(self, redditor_stub, redditor_context_query_cls, request_metadata_stub):
        context_query = redditor_context_query_cls(
            context=redditor_stub, prompt="What is the weather like?", request_meta=request_metadata_stub, response="The weather is sunny."
        )
        expected_str = f"RedditorContextQuery(context={redditor_stub.username}, prompt={Truncator(context_query.prompt).chars(100)}, response={Truncator(context_query.response).chars(100)})"
        assert str(context_query) == expected_str


@pytest.mark.django_db
class TestRedditorData:
    def test_create(self, redditor_stub, redditor_data_cls, request_metadata_stub):
        redditor_data = redditor_data_cls(
            redditor=redditor_stub,
            age=25,
            interests=["coding", "reading"],
            iq=130,
            request_meta=request_metadata_stub,
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.6,
            summary="A very active user.",
        )
        assert redditor_data.redditor is redditor_stub
        assert redditor_data.age == 25
        assert redditor_data.interests == ["coding", "reading"]
        assert redditor_data.iq == 130
        assert redditor_data.sentiment_polarity == 0.5
        assert redditor_data.sentiment_subjectivity == 0.6
        assert redditor_data.summary == "A very active user."
        assert list(redditor_data.redditor.data.all()) == [redditor_data]
        assert redditor_data.request_meta.redditordata is redditor_data

    def test_str(self, redditor_stub, redditor_data_cls, request_metadata_stub):
        redditor_data = redditor_data_cls(
            redditor=redditor_stub,
            age=25,
            interests=["coding", "reading"],
            iq=130,
            request_meta=request_metadata_stub,
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.6,
            summary="A very active user.",
        )
        expected_str = f"RedditorData(age={redditor_data.age}, iq={redditor_data.iq}, interests={redditor_data.interests}, redditor={redditor_stub.username}, sentiment_polarity={redditor_data.sentiment_polarity}, sentiment_subjectivity={redditor_data.sentiment_subjectivity}, summary={Truncator(redditor_data.summary).chars(100)})"
        assert str(redditor_data) == expected_str


@pytest.mark.django_db
class TestUnprocessableRedditor:
    def test_create(self, unprocessable_redditor_cls):
        unprocessable_redditor = unprocessable_redditor_cls(username="testuser", reason="not enough data")
        assert unprocessable_redditor.username == "testuser"
        assert unprocessable_redditor.reason == "not enough data"

    def test_str(self, unprocessable_redditor_cls):
        unprocessable_redditor = unprocessable_redditor_cls(username="testuser", reason="not enough data")
        expected_str = f"UnprocessableRedditor(username={unprocessable_redditor.username}, reason={unprocessable_redditor.reason})"
        assert str(unprocessable_redditor) == expected_str


@pytest.mark.django_db
class TestUnprocessableRedditorContextQuery:
    def test_create(self, unprocessable_redditor_context_query_cls):
        unprocessable_context_query = unprocessable_redditor_context_query_cls(username="testuser", reason="not enough data")
        assert unprocessable_context_query.username == "testuser"
        assert unprocessable_context_query.reason == "not enough data"

    def test_str(self, unprocessable_redditor_context_query_cls):
        unprocessable_context_query = unprocessable_redditor_context_query_cls(username="testuser", reason="not enough data")
        expected_str = f"UnprocessableRedditorContextQuery(username={unprocessable_context_query.username}, reason={unprocessable_context_query.reason})"
        assert str(unprocessable_context_query) == expected_str
