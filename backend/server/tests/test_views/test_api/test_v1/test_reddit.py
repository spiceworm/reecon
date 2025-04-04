import pytest
from constance import config
from constance.test import override_config
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
import rq.exceptions
from unittest.mock import (
    Mock,
    patch,
)


@pytest.fixture(autouse=True)
def mock_openai_client():
    """
    Mock OpenAI client to prevent actual API calls during tests."""
    with patch("openai.OpenAI") as mock_openai_client:
        mock_openai_client.return_value.models.list.return_value = []
        yield mock_openai_client


@pytest.fixture
def mock_queue():
    """
    Mock RQ job queue to prevent actual job creation.
    """
    with patch("django_rq.get_queue") as get_queue_mock:
        queue = Mock()
        queue.get_job_ids.return_value = []
        queue.enqueue.return_value = Mock(id="test-job-id")
        get_queue_mock.return_value = queue
        yield queue


@pytest.fixture(autouse=True)
def set_data_processing_llm(llm_stub):
    """
    Fixture to set the LLM name in the config for data processing.
    """
    # Using `llm_stub` causes the `LLM` object to be created in the database.
    with override_config(LLM_NAME=llm_stub.name):
        yield


@pytest.mark.django_db
class TestRedditorContextQueryViewSet:
    @pytest.fixture
    def create_url_path(self):
        """
        Fixture to provide the URL path for creating a RedditorContextQuery.
        """
        return reverse("reddit-redditor-context-query-list")

    @pytest.fixture
    def detail_url_path(self):
        """
        Fixture to provide the URL path for retrieving a RedditorContextQuery by job ID.
        """
        return reverse("reddit-redditor-context-query-detail", kwargs={"job_id": "test-job-id"})

    @pytest.fixture
    def list_url_path(self):
        """
        Fixture to provide the URL path for listing RedditorContextQueries.
        """
        return reverse("reddit-redditor-context-query-list")

    @pytest.fixture
    def redditor_context_query_processing_disabled(self, status_message_cls):
        """
        Fixture to disable Redditor context query processing for all users.
        """
        status_message_cls(
            name="redditorContextQueryProcessingDisabled",
            active=False,
            active_is_computed=True,
            category="warning",
            message="Redditor context query processing disabled for all users",
            source="api",
        )

        with override_config(REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED=False):
            yield

    @pytest.fixture
    def redditor_context_query_processing_enabled(self, status_message_cls):
        """
        Fixture to enable Redditor context query processing for all users.
        """
        status_message_cls(
            name="redditorContextQueryProcessingDisabled",
            active=True,
            active_is_computed=True,
            category="warning",
            message="Redditor context query processing disabled for all users",
            source="api",
        )

        with override_config(REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED=True):
            yield

    def test_create(self, auth_client, create_url_path, llm_stub, mock_queue, redditor_stub, redditor_context_query_processing_enabled):
        """
        Test the creation of a RedditorContextQuery.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "llm_name": llm_stub.name,
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
                "prompt": "Test prompt",
                "username": redditor_stub.username,
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.json()["job_id"]) > 0

    def test_create_if_context_querying_disabled(self, auth_client, create_url_path, llm_stub, redditor_stub, redditor_context_query_processing_disabled):
        """
        Test the creation of a RedditorContextQuery when context querying is disabled.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "llm_name": llm_stub.name,
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
                "prompt": "Test prompt",
                "username": redditor_stub.username,
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json() == {"job_id": ""}

    def test_create_if_unauthenticated(self, api_client, create_url_path, llm_stub, redditor_stub):
        """
        Test submitting a RedditorContextQuery when the user is not authenticated.
        """
        response = api_client.post(
            path=create_url_path,
            data={
                "llm_name": llm_stub.name,
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
                "prompt": "Test prompt",
                "username": redditor_stub.username,
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list(self, api_client, list_url_path, redditor_context_query_stub):
        """
        Test retrieving a list of RedditorContextQueries submitted by a user.
        """
        api_client.force_authenticate(user=redditor_context_query_stub.request_meta.submitter)
        response = api_client.get(list_url_path)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1

    def test_list_only_returns_user_submitted_queries(self, api_client, list_url_path, redditor_context_query_stub, user_cls):
        """
        Test that the list endpoint only returns queries submitted by the authenticated user.
        """
        api_client.force_authenticate(user=user_cls(username="other-user", password="password"))
        response1 = api_client.get(list_url_path)
        assert response1.status_code == status.HTTP_200_OK
        assert len(response1.json()) == 0

        api_client.force_authenticate(user=redditor_context_query_stub.request_meta.submitter)
        response2 = api_client.get(list_url_path)
        assert response2.status_code == status.HTTP_200_OK
        assert len(response2.json()) == 1

    def test_list_if_no_context_queries(self, auth_client, list_url_path):
        """
        Test the list endpoint when no RedditorContextQueries exist for the user.
        """
        response = auth_client.get(list_url_path)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 0

    @patch("app.views.api.v1.reddit.Job.fetch")
    def test_retrieve(self, mock_job, api_client, detail_url_path, redditor_context_query_stub):
        """
        Test retrieving a RedditorContextQuery by job ID.
        """
        mock_job.return_value = Mock(is_finished=True, return_value=lambda: redditor_context_query_stub)

        api_client.force_authenticate(user=redditor_context_query_stub.request_meta.submitter)
        response = api_client.get(detail_url_path)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["error"] is None

        success_data = data["success"]
        # Check context keys individually because we are not going to test the context["data"] field here.
        # It will be checked in a different test case.
        context = success_data["context"]
        assert context["created"] == redditor_context_query_stub.context.created.isoformat().replace("+00:00", "Z")
        assert context["identifier"] == redditor_context_query_stub.context.identifier
        assert context["last_processed"] == redditor_context_query_stub.context.last_processed.isoformat().replace("+00:00", "Z")
        assert context["source"] == redditor_context_query_stub.context.source
        assert context["username"] == redditor_context_query_stub.context.username

        assert success_data["created"] == redditor_context_query_stub.created.isoformat().replace("+00:00", "Z")
        assert success_data["prompt"] == redditor_context_query_stub.prompt
        assert success_data["request_meta"] == {
            "contributor": {
                "username": redditor_context_query_stub.request_meta.contributor.username,
            },
            "llm": {
                "context_window": redditor_context_query_stub.request_meta.llm.context_window,
                "description": redditor_context_query_stub.request_meta.llm.description,
                "name": redditor_context_query_stub.request_meta.llm.name,
                "provider": {
                    "description": redditor_context_query_stub.request_meta.llm.provider.description,
                    "display_name": redditor_context_query_stub.request_meta.llm.provider.display_name,
                    "name": redditor_context_query_stub.request_meta.llm.provider.name,
                },
            },
            "submitter": {
                "username": redditor_context_query_stub.request_meta.submitter.username,
            },
            "input_tokens": redditor_context_query_stub.request_meta.input_tokens,
            "output_tokens": redditor_context_query_stub.request_meta.output_tokens,
            "total_tokens": redditor_context_query_stub.request_meta.total_tokens,
            "total_inputs": redditor_context_query_stub.request_meta.total_inputs,
        }
        assert success_data["response"] == redditor_context_query_stub.response

    @patch("app.views.api.v1.reddit.Job.fetch", return_value=Mock(is_finished=False))
    def test_retrieve_if_job_not_finished(self, _, api_client, detail_url_path, redditor_context_query_stub):
        """
        Test retrieving a RedditorContextQuery when the job is not finished.
        """
        api_client.force_authenticate(user=redditor_context_query_stub.request_meta.submitter)
        response = api_client.get(detail_url_path)
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.json() == {}

    @patch("app.views.api.v1.reddit.Job.fetch")
    def test_retrieve_if_unprocessable(self, mock_job, api_client, detail_url_path, unprocessable_redditor_context_query_stub, user_stub):
        """
        Test retrieving a RedditorContextQuery when the job is unprocessable.
        """
        mock_job.return_value = Mock(is_finished=True, return_value=lambda: unprocessable_redditor_context_query_stub)
        api_client.force_authenticate(user=user_stub)
        response = api_client.get(detail_url_path)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["success"] is None
        assert data["error"] == {
            "created": unprocessable_redditor_context_query_stub.created.isoformat().replace("+00:00", "Z"),
            "reason": unprocessable_redditor_context_query_stub.reason,
            "username": unprocessable_redditor_context_query_stub.username,
        }

    @patch("app.views.api.v1.reddit.Job.fetch", side_effect=rq.exceptions.NoSuchJobError())
    def test_retrieve_with_invalid_job_id(self, _, api_client, detail_url_path, redditor_context_query_stub):
        """
        Test retrieving a RedditorContextQuery with an invalid job ID.
        """
        api_client.force_authenticate(user=redditor_context_query_stub.request_meta.submitter)
        response = api_client.get(detail_url_path)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json() == {}


@pytest.mark.django_db
class TestRedditorDataViewSet:
    @pytest.fixture
    def create_url_path(self):
        """
        Fixture to provide the URL path for creating a RedditorData.
        """
        return reverse("reddit-redditor-data-list")

    @pytest.fixture
    def redditor_data_processing_disabled(self, status_message_cls):
        """
        Fixture to disable Redditor data processing for all users.
        """
        status_message_cls(
            name="redditorDataProcessingDisabled",
            active=True,
            active_is_computed=True,
            category="warning",
            message="Redditor data processing disabled for all users",
            source="api",
        )

        with override_config(REDDITOR_DATA_PROCESSING_ENABLED=False):
            yield

    @pytest.fixture
    def redditor_data_processing_enabled(self, status_message_cls):
        """
        Fixture to enable Redditor data processing for all users.
        """
        status_message_cls(
            name="redditorDataProcessingDisabled",
            active=False,
            active_is_computed=True,
            category="warning",
            message="Redditor data processing disabled for all users",
            source="api",
        )

        with override_config(REDDITOR_DATA_PROCESSING_ENABLED=True):
            yield

    def test_create_if_duplicate_job(self, auth_client, create_url_path, mock_queue, redditor_data_processing_enabled):
        """
        Test that no jobs are created when a duplicate job is detected.
        """
        username = "unprocessed-redditor"
        mock_queue.get_job_ids.return_value = [f"redditor-{username}"]

        response = auth_client.post(
            path=create_url_path,
            data={
                "usernames": [username],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["ignored"]) == 0
        assert len(response_data["processed"]) == 0
        assert len(response_data["pending"]) == 1
        assert len(response_data["unprocessable"]) == 0
        assert response_data["pending"][0] == {"username": username}

    def test_create_if_processing_disabled(self, auth_client, create_url_path, mock_queue, redditor_data_processing_disabled):
        """
        Test submitting usernames when Redditor data processing is disabled.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "usernames": [],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["ignored"]) == 0
        assert len(response_data["processed"]) == 0
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 0

    def test_create_if_unauthenticated(self, api_client, create_url_path):
        """
        Test submitting usernames when the user is not authenticated.
        """
        response = api_client.post(
            path=create_url_path,
            data={
                "usernames": [],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_with_fresh_username(self, auth_client, create_url_path, mock_queue, redditor_cls, redditor_data_processing_enabled):
        """
        Test submitting a fresh username for Redditor data processing. A fresh username is one that was processed recently.
        """
        redditor = redditor_cls(username="fresh_redditor", with_data=True)
        redditor_data = redditor.data.first()
        request_meta = redditor_data.request_meta
        response = auth_client.post(
            path=create_url_path,
            data={
                "usernames": [redditor.username],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["ignored"]) == 0
        assert len(response_data["processed"]) == 1
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 0
        assert response_data["processed"][0] == {
            "created": redditor.created.isoformat().replace("+00:00", "Z"),
            "data": {
                "age": redditor_data.age,
                "created": redditor_data.created.isoformat().replace("+00:00", "Z"),
                "interests": redditor_data.interests,
                "iq": redditor_data.iq,
                "request_meta": {
                    "contributor": {"username": request_meta.contributor.username},
                    "input_tokens": request_meta.input_tokens,
                    "llm": {
                        "context_window": request_meta.llm.context_window,
                        "description": request_meta.llm.description,
                        "name": request_meta.llm.name,
                        "provider": {
                            "description": request_meta.llm.provider.description,
                            "display_name": request_meta.llm.provider.display_name,
                            "name": request_meta.llm.provider.name,
                        },
                    },
                    "output_tokens": request_meta.output_tokens,
                    "submitter": {"username": request_meta.submitter.username},
                    "total_inputs": request_meta.total_inputs,
                    "total_tokens": request_meta.total_tokens,
                },
                "sentiment_polarity": redditor_data.sentiment_polarity,
                "sentiment_subjectivity": redditor_data.sentiment_subjectivity,
                "summary": redditor_data.summary,
            },
            "identifier": redditor.identifier,
            "last_processed": redditor.last_processed.isoformat().replace("+00:00", "Z"),
            "source": redditor.source,
            "username": redditor.username,
        }

    def test_create_with_ignored_username(self, auth_client, create_url_path, ignored_redditor_stub, mock_queue, redditor_data_processing_enabled):
        """
        Test submitting an ignored username for processing.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "usernames": [ignored_redditor_stub.username],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["ignored"]) == 1
        assert len(response_data["processed"]) == 0
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 0
        assert response_data["ignored"][0] == {
            "identifier": ignored_redditor_stub.identifier,
            "source": ignored_redditor_stub.source,
            "created": ignored_redditor_stub.created.isoformat().replace("+00:00", "Z"),
            "reason": ignored_redditor_stub.reason,
            "username": ignored_redditor_stub.username,
        }

    def test_create_with_stale_username(self, auth_client, create_url_path, mock_queue, redditor_cls, redditor_data_processing_enabled):
        """
        Test submitting a stale username for Redditor data processing. A stale username is one that was processed a long time ago
        and should be reprocessed.
        """
        stale_redditor = redditor_cls(last_processed=timezone.now() - config.REDDITOR_FRESHNESS_TD, username="stale_redditor", with_data=True)
        response = auth_client.post(
            path=create_url_path,
            data={
                "usernames": [stale_redditor.username],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        # Verify the job was queued for the pending username resulting from the stale redditor
        mock_queue.enqueue.assert_called_once()
        kwargs = mock_queue.enqueue.call_args[1]["kwargs"]
        response_data = response.json()
        assert kwargs["redditor_username"] == stale_redditor.username
        assert len(response_data["ignored"]) == 0
        assert len(response_data["processed"]) == 1
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 0

    def test_create_with_unprocessable_username(self, auth_client, create_url_path, mock_queue, redditor_data_processing_enabled, unprocessable_redditor_stub):
        """
        Test submitting an unprocessable username for Redditor data processing.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "usernames": [unprocessable_redditor_stub.username],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["ignored"]) == 0
        assert len(response_data["processed"]) == 0
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 1
        assert response_data["unprocessable"][0] == {
            "identifier": unprocessable_redditor_stub.identifier,
            "source": unprocessable_redditor_stub.source,
            "created": unprocessable_redditor_stub.created.isoformat().replace("+00:00", "Z"),
            "username": unprocessable_redditor_stub.username,
            "reason": unprocessable_redditor_stub.reason,
        }


@pytest.mark.django_db
class TestThreadContextQueryViewSet:
    @pytest.fixture
    def create_url_path(self):
        """
        Fixture to provide the URL path for creating a ThreadContextQuery.
        """
        return reverse("reddit-thread-context-query-list")

    @pytest.fixture
    def detail_url_path(self):
        """
        Fixture to provide the URL path for retrieving a ThreadContextQuery by job ID.
        """
        return reverse("reddit-thread-context-query-detail", kwargs={"job_id": "test-job-id"})

    @pytest.fixture
    def list_url_path(self):
        """
        Fixture to provide the URL path for listing ThreadContextQueries.
        """
        return reverse("reddit-thread-context-query-list")

    @pytest.fixture
    def thread_context_query_processing_disabled(self, status_message_cls):
        """
        Fixture to disable Thread context query processing for all users.
        """
        status_message_cls(
            name="threadContextQueryProcessingDisabled",
            active=False,
            active_is_computed=True,
            category="warning",
            message="Thread context query processing disabled for all users",
            source="api",
        )

        with override_config(THREAD_CONTEXT_QUERY_PROCESSING_ENABLED=False):
            yield

    @pytest.fixture
    def thread_context_query_processing_enabled(self, status_message_cls):
        """
        Fixture to enable Thread context query processing for all users.
        """
        status_message_cls(
            name="threadContextQueryProcessingDisabled",
            active=True,
            active_is_computed=True,
            category="warning",
            message="Thread context query processing disabled for all users",
            source="api",
        )

        with override_config(THREAD_CONTEXT_QUERY_PROCESSING_ENABLED=True):
            yield

    def test_create(self, auth_client, create_url_path, llm_stub, mock_queue, thread_context_query_processing_enabled, thread_stub):
        """
        Test the creation of a ThreadContextQuery.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "llm_name": llm_stub.name,
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
                "path": thread_stub.path,
                "prompt": "Test prompt",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.json()["job_id"]) > 0

    def test_create_if_context_querying_disabled(self, auth_client, create_url_path, llm_stub, thread_context_query_processing_disabled, thread_stub):
        """
        Test the creation of a ThreadContextQuery when context querying is disabled.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "llm_name": llm_stub.name,
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
                "path": thread_stub.path,
                "prompt": "Test prompt",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json() == {"job_id": ""}

    def test_create_if_unauthenticated(self, api_client, create_url_path, llm_stub, thread_stub):
        """
        Test submitting a ThreadContextQuery when the user is not authenticated.
        """
        response = api_client.post(
            path=create_url_path,
            data={
                "llm_name": llm_stub.name,
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
                "path": thread_stub.path,
                "prompt": "Test prompt",
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list(self, api_client, list_url_path, thread_context_query_stub):
        """
        Test retrieving a list of ThreadContextQueries submitted by a user.
        """
        api_client.force_authenticate(user=thread_context_query_stub.request_meta.submitter)
        response = api_client.get(list_url_path)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1

    def test_list_only_returns_user_submitted_queries(self, api_client, list_url_path, thread_context_query_stub, user_cls):
        """
        Test that the list endpoint only returns queries submitted by the authenticated user.
        """
        api_client.force_authenticate(user=user_cls(username="other-user", password="password"))
        response1 = api_client.get(list_url_path)
        assert response1.status_code == status.HTTP_200_OK
        assert len(response1.json()) == 0

        api_client.force_authenticate(user=thread_context_query_stub.request_meta.submitter)
        response2 = api_client.get(list_url_path)
        assert response2.status_code == status.HTTP_200_OK
        assert len(response2.json()) == 1

    def test_list_if_no_context_queries(self, auth_client, list_url_path):
        """
        Test the list endpoint when no ThreadContextQueries exist for the user.
        """
        response = auth_client.get(list_url_path)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 0

    @patch("app.views.api.v1.reddit.Job.fetch")
    def test_retrieve(self, mock_job, api_client, detail_url_path, thread_context_query_stub):
        """
        Test retrieving a ThreadContextQuery by job ID.
        """
        mock_job.return_value = Mock(is_finished=True, return_value=lambda: thread_context_query_stub)

        api_client.force_authenticate(user=thread_context_query_stub.request_meta.submitter)
        response = api_client.get(detail_url_path)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["error"] is None

        success_data = data["success"]
        # Check context keys individually because we are not going to test the context["data"] field here.
        # It will be checked in a different test case.
        context = success_data["context"]
        assert context["created"] == thread_context_query_stub.context.created.isoformat().replace("+00:00", "Z")
        assert context["identifier"] == thread_context_query_stub.context.identifier
        assert context["last_processed"] == thread_context_query_stub.context.last_processed.isoformat().replace("+00:00", "Z")
        assert context["path"] == thread_context_query_stub.context.path
        assert context["source"] == thread_context_query_stub.context.source

        assert success_data["created"] == thread_context_query_stub.created.isoformat().replace("+00:00", "Z")
        assert success_data["prompt"] == thread_context_query_stub.prompt
        assert success_data["request_meta"] == {
            "contributor": {
                "username": thread_context_query_stub.request_meta.contributor.username,
            },
            "llm": {
                "context_window": thread_context_query_stub.request_meta.llm.context_window,
                "description": thread_context_query_stub.request_meta.llm.description,
                "name": thread_context_query_stub.request_meta.llm.name,
                "provider": {
                    "description": thread_context_query_stub.request_meta.llm.provider.description,
                    "display_name": thread_context_query_stub.request_meta.llm.provider.display_name,
                    "name": thread_context_query_stub.request_meta.llm.provider.name,
                },
            },
            "submitter": {
                "username": thread_context_query_stub.request_meta.submitter.username,
            },
            "input_tokens": thread_context_query_stub.request_meta.input_tokens,
            "output_tokens": thread_context_query_stub.request_meta.output_tokens,
            "total_tokens": thread_context_query_stub.request_meta.total_tokens,
            "total_inputs": thread_context_query_stub.request_meta.total_inputs,
        }
        assert success_data["response"] == thread_context_query_stub.response

    @patch("app.views.api.v1.reddit.Job.fetch", return_value=Mock(is_finished=False))
    def test_retrieve_if_job_not_finished(self, _, api_client, detail_url_path, thread_context_query_stub):
        """
        Test retrieving a ThreadContextQuery when the job is not finished.
        """
        api_client.force_authenticate(user=thread_context_query_stub.request_meta.submitter)
        response = api_client.get(detail_url_path)
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.json() == {}

    @patch("app.views.api.v1.reddit.Job.fetch")
    def test_retrieve_if_unprocessable(self, mock_job, auth_client, detail_url_path, unprocessable_thread_context_query_stub):
        """
        Test retrieving a ThreadContextQuery when the job is unprocessable.
        """
        mock_job.return_value = Mock(is_finished=True, return_value=lambda: unprocessable_thread_context_query_stub)
        response = auth_client.get(detail_url_path)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["success"] is None
        assert data["error"] == {
            "created": unprocessable_thread_context_query_stub.created.isoformat().replace("+00:00", "Z"),
            "path": unprocessable_thread_context_query_stub.path,
            "reason": unprocessable_thread_context_query_stub.reason,
        }

    @patch("app.views.api.v1.reddit.Job.fetch", side_effect=rq.exceptions.NoSuchJobError())
    def test_retrieve_with_invalid_job_id(self, _, api_client, detail_url_path, thread_context_query_stub):
        """
        Test retrieving a ThreadContextQuery with an invalid job ID.
        """
        api_client.force_authenticate(user=thread_context_query_stub.request_meta.submitter)
        response = api_client.get(detail_url_path)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json() == {}


@pytest.mark.django_db
class TestThreadDataViewSet:
    @pytest.fixture
    def create_url_path(self):
        """
        Fixture to provide the URL path for creating a ThreadData.
        """
        return reverse("reddit-thread-data-list")

    @pytest.fixture
    def thread_data_processing_disabled(self, status_message_cls):
        """
        Fixture to disable Thread data processing for all users.
        """
        status_message_cls(
            name="threadDataProcessingDisabled",
            active=True,
            active_is_computed=True,
            category="warning",
            message="Thread data processing disabled for all users",
            source="api",
        )

        with override_config(THREAD_DATA_PROCESSING_ENABLED=False):
            yield

    @pytest.fixture
    def thread_data_processing_enabled(self, status_message_cls):
        """
        Fixture to enable Thread data processing for all users.
        """
        status_message_cls(
            name="threadDataProcessingDisabled",
            active=False,
            active_is_computed=True,
            category="warning",
            message="Thread data processing disabled for all users",
            source="api",
        )

        with override_config(THREAD_DATA_PROCESSING_ENABLED=True):
            yield

    def test_create_if_duplicate_job(self, auth_client, create_url_path, mock_queue, thread_data_processing_enabled):
        """
        Test that no jobs are created when a duplicate job is detected.
        """
        subreddit = "test"
        thread_id = "unprocessedthread"
        thread_path = f"/r/{subreddit}/comments/{thread_id}"
        mock_queue.get_job_ids.return_value = [f"thread-{subreddit}-{thread_id}"]

        response = auth_client.post(
            path=create_url_path,
            data={
                "paths": [thread_path],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["processed"]) == 0
        assert len(response_data["pending"]) == 1
        assert len(response_data["unprocessable"]) == 0
        assert response_data["pending"][0] == {"path": thread_path}

    def test_create_if_processing_disabled(self, auth_client, create_url_path, mock_queue, thread_data_processing_disabled):
        """
        Test submitting paths when Thread data processing is disabled.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "paths": [],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["processed"]) == 0
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 0

    def test_create_if_unauthenticated(self, api_client, create_url_path):
        """
        Test submitting paths when the user is not authenticated.
        """
        response = api_client.post(
            path=create_url_path,
            data={
                "paths": [],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_with_fresh_path(self, auth_client, create_url_path, mock_queue, thread_cls, thread_data_processing_enabled):
        """
        Test submitting a fresh path for Thread data processing. A fresh path is one that was processed recently.
        """
        thread = thread_cls(path="/r/test/comments/asdf", with_data=True)
        thread_data = thread.data.first()
        request_meta = thread_data.request_meta
        response = auth_client.post(
            path=create_url_path,
            data={
                "paths": [thread.path],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["processed"]) == 1
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 0
        assert response_data["processed"][0] == {
            "created": thread.created.isoformat().replace("+00:00", "Z"),
            "data": {
                "created": thread_data.created.isoformat().replace("+00:00", "Z"),
                "keywords": thread_data.keywords,
                "request_meta": {
                    "contributor": {"username": request_meta.contributor.username},
                    "input_tokens": request_meta.input_tokens,
                    "llm": {
                        "context_window": request_meta.llm.context_window,
                        "description": request_meta.llm.description,
                        "name": request_meta.llm.name,
                        "provider": {
                            "description": request_meta.llm.provider.description,
                            "display_name": request_meta.llm.provider.display_name,
                            "name": request_meta.llm.provider.name,
                        },
                    },
                    "output_tokens": request_meta.output_tokens,
                    "submitter": {"username": request_meta.submitter.username},
                    "total_inputs": request_meta.total_inputs,
                    "total_tokens": request_meta.total_tokens,
                },
                "sentiment_polarity": thread_data.sentiment_polarity,
                "sentiment_subjectivity": thread_data.sentiment_subjectivity,
                "summary": thread_data.summary,
            },
            "identifier": thread.identifier,
            "last_processed": thread.last_processed.isoformat().replace("+00:00", "Z"),
            "path": thread.path,
            "source": thread.source,
        }

    def test_create_with_stale_path(self, auth_client, create_url_path, mock_queue, thread_cls, thread_data_processing_enabled):
        """
        Test submitting a stale path for Thread data processing. A stale path is one that was processed a long time ago
        and should be reprocessed.
        """
        stale_thread = thread_cls(last_processed=timezone.now() - config.THREAD_FRESHNESS_TD, path="/r/test/comments/asdf", with_data=True)
        response = auth_client.post(
            path=create_url_path,
            data={
                "paths": [stale_thread.path],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        mock_queue.enqueue.assert_called_once()
        kwargs = mock_queue.enqueue.call_args[1]["kwargs"]
        response_data = response.json()
        assert kwargs["thread_path"] == stale_thread.path
        assert len(response_data["processed"]) == 1
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 0

    def test_create_with_unprocessable_path(self, auth_client, create_url_path, mock_queue, thread_data_processing_enabled, unprocessable_thread_stub):
        """
        Test submitting an unprocessable path for Thread data processing.
        """
        response = auth_client.post(
            path=create_url_path,
            data={
                "paths": [unprocessable_thread_stub.path],
                "llm_providers_settings": {
                    "openai": {"api_key": "test-key"},
                },
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        mock_queue.enqueue.assert_not_called()
        assert len(response_data["processed"]) == 0
        assert len(response_data["pending"]) == 0
        assert len(response_data["unprocessable"]) == 1
        assert response_data["unprocessable"][0] == {
            "identifier": unprocessable_thread_stub.identifier,
            "path": unprocessable_thread_stub.path,
            "source": unprocessable_thread_stub.source,
            "created": unprocessable_thread_stub.created.isoformat().replace("+00:00", "Z"),
            "reason": unprocessable_thread_stub.reason,
        }
