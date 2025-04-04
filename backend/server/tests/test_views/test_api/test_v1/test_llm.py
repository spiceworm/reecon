from constance import config
from django.urls import reverse
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestLlmDefaultsView:
    @pytest.fixture
    def retrieve_url_path(self):
        """
        Fixture to provide the detail URL path for LLM defaults.
        """
        return reverse("llm-defaults")

    def test_retrieve_llm_defaults(self, auth_client, retrieve_url_path):
        """
        Test retrieving LLM default prompts.
        """
        response = auth_client.get(retrieve_url_path)
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {
            "prompts": {
                "process_redditor_context_query": config.REDDITOR_LLM_CONTEXT_QUERY_PROMPT,
                "process_redditor_data": config.REDDITOR_LLM_DATA_PROMPT,
                "process_thread_context_query": config.THREAD_LLM_CONTEXT_QUERY_PROMPT,
                "process_thread_data": config.THREAD_LLM_DATA_PROMPT,
            }
        }

    def test_retrieve_llm_defaults_unauthenticated(self, api_client, retrieve_url_path):
        """
        Test retrieving LLM defaults without authentication.
        """
        response = api_client.get(retrieve_url_path)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
