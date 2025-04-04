from django.urls import reverse
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestStatusMessagesViewSet:
    @pytest.fixture
    def list_url_path(self):
        """
        URL path for the list view of status messages.
        """
        return reverse("status-messages-list")

    def test_list(self, auth_client, list_url_path, status_message_cls):
        """
        Test the list view of status messages.
        """
        status_message = status_message_cls(
            active=True,
            active_is_computed=False,
            category="warning",
            message="Test message",
            name="testMessage",
            source="api",
        )
        response = auth_client.get(list_url_path)
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == [
            {
                "active": status_message.active,
                "category": status_message.category,
                "message": status_message.message,
                "name": status_message.name,
                "source": status_message.source,
            }
        ]

    def test_list_if_unauthenticated(self, api_client, list_url_path):
        """
        Test the list view of status messages if the user is not authenticated.
        """
        response = api_client.get(list_url_path)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestStatusView:
    @pytest.fixture
    def retrieve_url_path(self):
        """
        URL path for the retrieve view of status.
        """
        return reverse("status")

    def test_retrieve(self, api_client, retrieve_url_path):
        """
        Test the retrieve view of status.
        """
        response = api_client.get(retrieve_url_path)
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"status": "ok"}
