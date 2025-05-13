import datetime as dt
import sys
from unittest.mock import (
    Mock,
    patch,
    PropertyMock,
)

from praw.exceptions import InvalidURL
from prawcore.exceptions import (
    Forbidden,
    NotFound,
)
from praw.models import MoreComments
import pytest
from requests.models import Response

from reecon.exceptions import (
    UnprocessableRedditorError,
    UnprocessableThreadError,
)
from reecon.models import (
    RedditorContextQuery,
    RedditorData,
    ThreadContextQuery,
    ThreadData,
    UnprocessableRedditor,
    UnprocessableThread,
)
from reecon.services.reddit import (
    RedditorBase,
    RedditorContextQueryService,
    RedditorDataService,
    ThreadBase,
    ThreadContextQueryService,
    ThreadDataService,
)
from reecon.schemas import (
    GeneratedRedditorContextQuery,
    GeneratedRedditorData,
    GeneratedThreadContextQuery,
    GeneratedThreadData,
    get_worker_env,
)


@pytest.fixture
def mock_llm_provider():
    with patch("reecon.services.reddit.llm_provider.LlmProvider") as mock:
        yield mock


@pytest.fixture
def mock_reddit_client(django_settings):
    # These are defined in the settings.py of the server app which has reecon installed.
    django_settings(
        REDDIT_API_CLIENT_ID="",
        REDDIT_API_CLIENT_SECRET="",
        REDDIT_API_RATELIMIT_SECONDS=1,
        REDDIT_API_USER_AGENT="",
    )

    with patch("reecon.services.reddit.Reddit") as mock:
        yield mock


@pytest.mark.django_db
class TestRedditorBase:
    @pytest.fixture
    def redditor_base_stub(self, llm_stub, mock_reddit_client, redditor_stub, user_stub):
        return RedditorBase(
            identifier=redditor_stub.username,
            contributor=user_stub,
            llm=llm_stub,
            llm_providers_settings={llm_stub.provider.name: {"api_key": "test_key"}},
            submitter=user_stub,
            env=get_worker_env(),
        )

    def test_get_inputs(self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, redditor_base_stub, thread_submission):
        """
        Test that the `get_inputs` method returns the correct inputs from the redditor's comments and submissions.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = [mock_praw_thread()]
        redditor.comments.new.return_value = [mock_praw_comment()]
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.reddit.submission.min_length = 1
        redditor_base_stub.env.redditor.submission.min_submissions = 1
        inputs = redditor_base_stub.get_inputs()
        assert inputs == [thread_submission(), comment_submission()]

    def test_get_inputs_excludes_duplicate_comments_text(self, comment_submission, mock_praw_comment, mock_reddit_client, redditor_base_stub):
        """
        Test that duplicate comments are excluded when getting inputs.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = []
        redditor.comments.new.return_value = [mock_praw_comment(body="Test comment"), mock_praw_comment(body="Test comment"), mock_praw_comment(body="Another comment")]
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.reddit.submission.min_length = 1
        redditor_base_stub.env.redditor.submission.min_submissions = 1
        inputs = redditor_base_stub.get_inputs()
        assert inputs == [comment_submission(text="Test comment"), comment_submission(text="Another comment")]

    def test_get_inputs_excludes_duplicate_thread_text(self, mock_praw_thread, mock_reddit_client, redditor_base_stub, thread_submission):
        """
        Test that duplicate threads are excluded when getting inputs.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = [
            mock_praw_thread(selftext="Test submission"),
            mock_praw_thread(selftext="Test submission"),
            mock_praw_thread(selftext="Another submission"),
        ]
        redditor.comments.new.return_value = []
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.reddit.submission.min_length = 1
        redditor_base_stub.env.redditor.submission.min_submissions = 1
        inputs = redditor_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission"), thread_submission(text="Another submission")]

    def test_get_inputs_excludes_short_comments_text(self, comment_submission, mock_praw_comment, mock_reddit_client, redditor_base_stub):
        """
        Test that short comments are excluded when getting inputs.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = []
        redditor.comments.new.return_value = [mock_praw_comment(body="Test comment"), mock_praw_comment(body="Bad")]
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.reddit.submission.min_length = 4
        redditor_base_stub.env.redditor.submission.min_submissions = 1
        inputs = redditor_base_stub.get_inputs()
        assert inputs == [comment_submission(text="Test comment")]

    def test_get_inputs_excludes_short_thread_text(self, mock_praw_thread, mock_reddit_client, redditor_base_stub, thread_submission):
        """
        Test that short threads are excluded when getting inputs.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = [mock_praw_thread(selftext="Test submission"), mock_praw_thread(selftext="Bad")]
        redditor.comments.new.return_value = []
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.reddit.submission.min_length = 4
        redditor_base_stub.env.redditor.submission.min_submissions = 1
        inputs = redditor_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission")]

    def test_get_inputs_ignores_morecomments(self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, redditor_base_stub, thread_submission):
        """
        Test that `MoreComments` objects are ignored when getting inputs.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = [mock_praw_thread(selftext="Test submission")]
        redditor.comments.new.return_value = [mock_praw_comment(body="Test comment"), MoreComments(mock_reddit_client, {"body": ""})]
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.reddit.submission.min_length = 1
        redditor_base_stub.env.redditor.submission.min_submissions = 1
        inputs = redditor_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission"), comment_submission(text="Test comment")]

    def test_get_inputs_prevents_comments_text_from_context_window_overflow(
        self, mock_praw_comment, mock_praw_thread, mock_reddit_client, redditor_base_stub, thread_submission
    ):
        """
        Test that if the body of a comment causes the total token count of all inputs to exceed the context window,
        that comment body is ignored.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = [mock_praw_thread(selftext="Test submission")]
        redditor.comments.new.return_value = [mock_praw_comment(body="Test comment" * redditor_base_stub.llm.context_window)]
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.reddit.submission.max_length = sys.maxsize
        redditor_base_stub.env.reddit.submission.min_length = 1
        redditor_base_stub.env.redditor.submission.min_submissions = 1
        inputs = redditor_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission")]

    def test_get_inputs_prevents_thread_text_from_context_window_overflow(
        self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, redditor_base_stub
    ):
        """
        Test that if the selftext of a thread causes the total token count of all inputs to exceed the context window,
        that thread selftext is ignored.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = [mock_praw_thread(selftext="Test submission" * redditor_base_stub.llm.context_window)]
        redditor.comments.new.return_value = [mock_praw_comment(body="Test comment")]
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.reddit.submission.max_length = sys.maxsize
        redditor_base_stub.env.reddit.submission.min_length = 1
        redditor_base_stub.env.redditor.submission.min_submissions = 1
        inputs = redditor_base_stub.get_inputs()
        assert inputs == [comment_submission(text="Test comment")]

    def test_get_inputs_if_inaccessible_reddit_account(self, mock_reddit_client, redditor_base_stub):
        """
        Test that if the redditor's account is inaccessible, an UnprocessableRedditorError is raised.
        """
        redditor = Mock([])  # Mock has no attributes defined so `praw_redditor.created_utc` will throw an AttributeError
        mock_reddit_client.return_value.redditor.return_value = redditor

        with pytest.raises(UnprocessableRedditorError) as excinfo:
            redditor_base_stub.get_inputs()

        assert excinfo.value.reason == "Inaccessible account"

    def test_get_inputs_if_unprocessable_from_lack_of_submissions(self, mock_reddit_client, redditor_base_stub):
        """
        Test that if the redditor has no submissions or comments, an UnprocessableRedditorError is raised.
        """
        redditor = Mock(["comments", "submissions"], created_utc=1234567890)
        redditor.submissions.new.return_value = []
        redditor.comments.new.return_value = []
        mock_reddit_client.return_value.redditor.return_value = redditor

        with pytest.raises(UnprocessableRedditorError) as excinfo:
            redditor_base_stub.get_inputs()

        assert f"Less than {redditor_base_stub.env.redditor.submission.min_submissions} submissions available for processing" in excinfo.value.reason

    def test_get_inputs_if_unprocessable_from_redditor_account_age(self, mock_reddit_client, redditor_base_stub):
        """
        Test that if the redditor's account is too young (less than the minimum age defined in the environment),
        an UnprocessableRedditorError is raised.
        """
        redditor = Mock(created_utc=dt.datetime.now(tz=dt.timezone.utc).timestamp())
        mock_reddit_client.return_value.redditor.return_value = redditor

        redditor_base_stub.env.redditor.account.min_age = dt.timedelta(days=100)
        with pytest.raises(UnprocessableRedditorError) as excinfo:
            redditor_base_stub.get_inputs()

        assert "Account age is less than" in excinfo.value.reason

    @pytest.mark.parametrize("praw_exception_cls", [Forbidden, NotFound])
    def test_get_inputs_if_redditor_lookup_exception(self, praw_exception_cls, mock_reddit_client, redditor_base_stub):
        """
        Test that if a PRAW exception is raised when looking up the redditor, it is handled and raised as an UnprocessableRedditorError.
        """
        redditor = Mock(["created_utc"])
        type(redditor).created_utc = PropertyMock(side_effect=praw_exception_cls(Response()))
        mock_reddit_client.return_value.redditor.return_value = redditor

        with pytest.raises(UnprocessableRedditorError):
            redditor_base_stub.get_inputs()

    def test_unprocessable_entity(self, redditor_base_stub):
        """
        Test that the `unprocessable_reason` method returns the correct reason for an unprocessable redditor.
        """
        with pytest.raises(UnprocessableRedditorError) as excinfo:
            raise redditor_base_stub.unprocessable_entity("test")

        assert excinfo.value.reason == "test"
        assert excinfo.value.username == redditor_base_stub.identifier
        assert excinfo.value.obj == UnprocessableRedditor.objects.get(username=redditor_base_stub.identifier)


@pytest.mark.django_db
class TestRedditorContextQueryService:
    @pytest.fixture
    def redditor_context_query_service_stub(self, llm_stub, mock_reddit_client, redditor_stub, user_stub):
        return RedditorContextQueryService(
            identifier=redditor_stub.username,
            contributor=user_stub,
            llm=llm_stub,
            llm_providers_settings={llm_stub.provider.name: {"api_key": "test_key"}},
            submitter=user_stub,
            env=get_worker_env(),
        )

    def test_create_object(self, comment_submission, redditor_context_query_service_stub):
        """
        Test that the `create_object` method creates a RedditorContextQuery object with the correct attributes.
        """
        generated = GeneratedRedditorContextQuery(
            inputs=[comment_submission(text="Test input")],
            prompt="Test context query prompt",
            usage_metadata={"input_tokens": 10, "output_tokens": 20, "total_tokens": 30},
            response="Test response",
        )

        obj = redditor_context_query_service_stub.create_object(generated=generated)
        assert isinstance(obj, RedditorContextQuery)
        assert obj.response == "Test response"
        assert obj.context.identifier == redditor_context_query_service_stub.identifier

    def test_generate(self, comment_submission, mock_llm_provider, redditor_context_query_service_stub):
        """
        Test that the `generate` method returns a GeneratedRedditorContextQuery object with the correct attributes.
        """
        mock_llm_provider.return_value.generate_data.return_value = {
            "raw": Mock(usage_metadata={"input_tokens": 10, "output_tokens": 20, "total_tokens": 30}),
            "parsed": Mock(model_dump=lambda: {"response": "Test response"}),
        }

        result = redditor_context_query_service_stub.generate(inputs=[comment_submission(text="Test input")], prompt="Test context query prompt")

        assert isinstance(result, GeneratedRedditorContextQuery)
        assert result.response == "Test response"


@pytest.mark.django_db
class TestRedditorDataService:
    @pytest.fixture
    def redditor_data_service_stub(self, llm_stub, mock_reddit_client, redditor_stub, user_stub):
        return RedditorDataService(
            identifier=redditor_stub.identifier,
            contributor=user_stub,
            llm=llm_stub,
            llm_providers_settings={llm_stub.provider.name: {"api_key": "test_key"}},
            submitter=user_stub,
            env=get_worker_env(),
        )

    def test_create_object(self, comment_submission, redditor_data_service_stub):
        """
        Test that the `create_object` method creates a RedditorData object with the correct attributes.
        """
        generated = GeneratedRedditorData(
            age=30,
            inputs=[comment_submission(text="Test input")],
            interests=["something"],
            iq=100,
            prompt="Test data prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata={"input_tokens": 10, "output_tokens": 20, "total_tokens": 30},
        )

        obj = redditor_data_service_stub.create_object(generated=generated)
        assert isinstance(obj, RedditorData)
        assert obj.age == 30
        assert obj.iq == 100
        assert obj.interests == ["something"]
        assert obj.sentiment_polarity == 0.5
        assert obj.sentiment_subjectivity == 0.5
        assert obj.summary == "Test summary"
        assert obj.redditor.identifier == redditor_data_service_stub.identifier

    def test_generate(self, comment_submission, mock_llm_provider, redditor_data_service_stub):
        """
        Test that the `generate` method returns a GeneratedRedditorData object with the correct attributes.
        """
        mock_llm_provider.return_value.generate_data.return_value = {
            "raw": Mock(usage_metadata={"input_tokens": 10, "output_tokens": 20, "total_tokens": 30}),
            "parsed": Mock(
                model_dump=lambda: {
                    "age": 30,
                    "iq": 100,
                    "interests": ["something"],
                    "sentiment_polarity": 0.5,
                    "sentiment_subjectivity": 0.5,
                    "summary": "Test summary",
                }
            ),
        }

        result = redditor_data_service_stub.generate(inputs=[comment_submission(text="Test input")], prompt="Test data prompt")

        assert isinstance(result, GeneratedRedditorData)
        assert result.age == 30
        assert result.iq == 100
        assert result.interests == ["something"]
        assert result.sentiment_polarity == 0.5
        assert result.sentiment_subjectivity == 0.5
        assert result.summary == "Test summary"


@pytest.mark.django_db
class TestThreadBase:
    @pytest.fixture
    def thread_base_stub(self, llm_stub, mock_reddit_client, thread_stub, user_stub):
        return ThreadBase(
            identifier=thread_stub.identifier,
            contributor=user_stub,
            llm=llm_stub,
            llm_providers_settings={llm_stub.provider.name: {"api_key": "test_key"}},
            submitter=user_stub,
            env=get_worker_env(),
        )

    def test_get_inputs(self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub, thread_submission):
        """
        Test that the `get_inputs` method returns the correct inputs from the thread's comments and submissions.
        """
        submission = mock_praw_thread(selftext="Test submission")
        submission.comments.list.return_value = [mock_praw_comment(body="Test comment")]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.min_length = 1
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission"), comment_submission(text="Test comment")]

    def test_get_inputs_excludes_duplicate_comments_text(
        self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub, thread_submission
    ):
        """
        Test that duplicate comments are excluded when getting inputs.
        """
        submission = mock_praw_thread(selftext="Test submission")
        submission.comments.list.return_value = [
            mock_praw_comment(body="Test comment"),
            mock_praw_comment(body="Test comment"),
            mock_praw_comment(body="Another comment"),
        ]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.min_length = 1
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission"), comment_submission(text="Test comment"), comment_submission(text="Another comment")]

    def test_get_inputs_excludes_duplicate_text(self, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub, thread_submission):
        """
        Test that duplicate text is excluded when getting inputs when considering thread selftext and comment bodies.
        """
        submission = mock_praw_thread(selftext="Test text")
        submission.comments.list.return_value = [mock_praw_comment(body="Test text")]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.min_length = 1
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test text")]

    def test_get_inputs_excludes_ignored_redditor_comments(
        self, comment_submission, ignored_redditor_stub, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub, thread_submission
    ):
        """
        Test that comments from ignored redditors are excluded when getting inputs.
        """
        submission = mock_praw_thread(selftext="Test submission")
        submission.comments.list.return_value = [
            mock_praw_comment(body="Test comment"),
            mock_praw_comment(**{"author.name": ignored_redditor_stub.username}, body="Ignored comment"),
        ]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.min_length = 1
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission"), comment_submission(text="Test comment")]

    def test_get_inputs_excludes_short_comments_text(self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub, thread_submission):
        """
        Test that comments with body length < `worker_env.reddit.submission.min_length` are excluded when getting inputs.
        """
        submission = mock_praw_thread(selftext="Test submission")
        submission.comments.list.return_value = [
            mock_praw_comment(body="Bad"),
            mock_praw_comment(body="Good"),
        ]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.min_length = 4
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission"), comment_submission(text="Good")]

    def test_get_inputs_excludes_short_thread_text(self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub):
        """
        Test that threads with selftext length < `worker_env.reddit.submission.min_length` are excluded when getting inputs.
        """
        submission = mock_praw_thread(selftext="Bad")
        submission.comments.list.return_value = [mock_praw_comment(body="Good")]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.min_length = 4
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [comment_submission(text="Good")]

    def test_get_inputs_ignores_morecomments(self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub, thread_submission):
        """
        Test that `MoreComments` objects are ignored when getting inputs.
        """
        submission = mock_praw_thread(selftext="Test submission")
        submission.comments.list.return_value = [mock_praw_comment(body="Test comment"), MoreComments(mock_reddit_client, {"body": ""})]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.min_length = 1
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission"), comment_submission(text="Test comment")]

    def test_get_inputs_prevents_comments_text_from_context_window_overflow(
        self, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub, thread_submission
    ):
        """
        Test that if the body of a comment causes the total token count of all inputs to exceed the context window,
        that comment body is ignored.
        """
        submission = mock_praw_thread(selftext="Test submission")
        submission.comments.list.return_value = [
            mock_praw_comment(body="Test comment" * thread_base_stub.llm.context_window),
        ]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.max_length = sys.maxsize
        thread_base_stub.env.reddit.submission.min_length = 1
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [thread_submission(text="Test submission")]

    def test_get_inputs_prevents_thread_text_from_context_window_overflow(self, comment_submission, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub):
        """
        Test that if the selftext of a thread causes the total token count of all inputs to exceed the context window,
        that thread selftext is ignored.
        """
        submission = mock_praw_thread(selftext="Test submission" * thread_base_stub.llm.context_window)
        submission.comments.list.return_value = [mock_praw_comment(body="Test comment")]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.max_length = sys.maxsize
        thread_base_stub.env.reddit.submission.min_length = 1
        thread_base_stub.env.thread.submission.min_submissions = 1
        inputs = thread_base_stub.get_inputs()
        assert inputs == [comment_submission(text="Test comment")]

    def test_get_inputs_if_invalid_thread_url(self, mock_reddit_client, thread_base_stub):
        """
        Test that if the thread URL is invalid, an UnprocessableThreadError is raised.
        """
        submission = Mock(side_effect=InvalidURL("https://old.reddit.com/r/test/thisthreaddoesnotexist"))
        mock_reddit_client.return_value.submission = submission

        with pytest.raises(UnprocessableThreadError):
            thread_base_stub.get_inputs()

    def test_get_inputs_if_unprocessable_from_lack_of_submissions(self, mock_praw_comment, mock_praw_thread, mock_reddit_client, thread_base_stub):
        """
        Test that if the thread has no submissions or comments after filtering rules are applied, an
        UnprocessableThreadError is raised.
        """
        submission = mock_praw_thread(selftext="Test submission")
        submission.comments.list.return_value = [mock_praw_comment(body="Test comment")]
        mock_reddit_client.return_value.submission.return_value = submission

        thread_base_stub.env.reddit.submission.min_length = 100
        thread_base_stub.env.thread.submission.min_submissions = 100

        with pytest.raises(UnprocessableThreadError) as excinfo:
            thread_base_stub.get_inputs()

        assert f"Less than {thread_base_stub.env.thread.submission.min_submissions} submissions available for processing" in excinfo.value.reason

    def test_get_inputs_if_thread_lookup_exception(self, mock_reddit_client, thread_base_stub):
        """
        Test that if a PRAW NotFound exception is raised when looking up the thread, it is handled and raised
        as an UnprocessableThreadError.
        """
        submission = Mock()
        type(submission).selftext = PropertyMock(side_effect=NotFound(Response()))
        mock_reddit_client.return_value.submission.return_value = submission

        with pytest.raises(UnprocessableThreadError):
            thread_base_stub.get_inputs()

    def test_unprocessable_entity(self, thread_base_stub):
        """
        Test that the `unprocessable_entity` method returns the correct object.
        """
        with pytest.raises(UnprocessableThreadError) as excinfo:
            raise thread_base_stub.unprocessable_entity("test")

        assert excinfo.value.reason == "test"
        assert excinfo.value.path == thread_base_stub.identifier
        assert excinfo.value.obj == UnprocessableThread.objects.get(path=thread_base_stub.identifier)


@pytest.mark.django_db
class TestThreadContextQueryService:
    @pytest.fixture
    def thread_context_query_service_stub(self, llm_stub, mock_reddit_client, thread_stub, user_stub):
        return ThreadContextQueryService(
            identifier=thread_stub.identifier,
            contributor=user_stub,
            llm=llm_stub,
            llm_providers_settings={llm_stub.provider.name: {"api_key": "test_key"}},
            submitter=user_stub,
            env=get_worker_env(),
        )

    def test_create_object(self, comment_submission, thread_context_query_service_stub):
        """
        Test that the `create_object` method creates a RedditorContextQuery object with the correct attributes.
        """
        generated = GeneratedThreadContextQuery(
            inputs=[comment_submission(text="Test input")],
            prompt="Test context query prompt",
            usage_metadata={"input_tokens": 10, "output_tokens": 20, "total_tokens": 30},
            response="Test response",
        )

        obj = thread_context_query_service_stub.create_object(generated=generated)
        assert isinstance(obj, ThreadContextQuery)
        assert obj.response == "Test response"
        assert obj.context.identifier == thread_context_query_service_stub.identifier

    def test_generate(self, comment_submission, mock_llm_provider, thread_context_query_service_stub):
        """
        Test that the `generate` method returns a GeneratedRedditorContextQuery object with the correct attributes.
        """
        mock_llm_provider.return_value.generate_data.return_value = {
            "raw": Mock(usage_metadata={"input_tokens": 10, "output_tokens": 20, "total_tokens": 30}),
            "parsed": Mock(model_dump=lambda: {"response": "Test response"}),
        }

        result = thread_context_query_service_stub.generate(inputs=[comment_submission(text="Test input")], prompt="Test context query prompt")

        assert isinstance(result, GeneratedThreadContextQuery)
        assert result.response == "Test response"


@pytest.mark.django_db
class TestThreadDataService:
    @pytest.fixture
    def thread_data_service_stub(self, llm_stub, mock_reddit_client, thread_stub, user_stub):
        return ThreadDataService(
            identifier=thread_stub.identifier,
            contributor=user_stub,
            llm=llm_stub,
            llm_providers_settings={llm_stub.provider.name: {"api_key": "test_key"}},
            submitter=user_stub,
            env=get_worker_env(),
        )

    def test_create_object(self, thread_data_service_stub, thread_submission):
        """
        Test that the `create_object` method creates a ThreadData object with the correct attributes.
        """
        generated = GeneratedThreadData(
            inputs=[thread_submission(text="Test input")],
            keywords=["test-keyword"],
            prompt="Test data prompt",
            sentiment_polarity=0.5,
            sentiment_subjectivity=0.5,
            summary="Test summary",
            usage_metadata={"input_tokens": 10, "output_tokens": 20, "total_tokens": 30},
        )

        obj = thread_data_service_stub.create_object(generated=generated)
        assert isinstance(obj, ThreadData)
        assert obj.keywords == ["test-keyword"]
        assert obj.sentiment_polarity == 0.5
        assert obj.sentiment_subjectivity == 0.5
        assert obj.summary == "Test summary"
        assert obj.thread.identifier == thread_data_service_stub.identifier

    def test_generate(self, mock_llm_provider, thread_data_service_stub, thread_submission):
        """
        Test that the `generate` method returns a GeneratedThreadData object with the correct attributes.
        """
        mock_llm_provider.return_value.generate_data.return_value = {
            "raw": Mock(usage_metadata={"input_tokens": 10, "output_tokens": 20, "total_tokens": 30}),
            "parsed": Mock(
                model_dump=lambda: {
                    "keywords": ["test-keyword"],
                    "sentiment_polarity": 0.5,
                    "sentiment_subjectivity": 0.5,
                    "summary": "Test summary",
                }
            ),
        }

        result = thread_data_service_stub.generate(inputs=[thread_submission(text="Test input")], prompt="Test data prompt")

        assert isinstance(result, GeneratedThreadData)
        assert result.keywords == ["test-keyword"]
        assert result.sentiment_polarity == 0.5
        assert result.sentiment_subjectivity == 0.5
        assert result.summary == "Test summary"
