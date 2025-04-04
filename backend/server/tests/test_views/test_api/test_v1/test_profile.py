from django.urls import reverse
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestProfileView:
    @pytest.fixture
    def retrieve_url_path(self):
        """
        Fixture to provide the URL path for the profile view.
        """
        return reverse("profile")

    def test_retrieve(self, api_client, profile_stub, retrieve_url_path):
        """
        Test that the profile view returns the expected data when the user is authenticated.
        """
        api_client.force_authenticate(user=profile_stub.user)
        response = api_client.get(retrieve_url_path)
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {
            "reddit_username": profile_stub.reddit_username,
            "signed_username": profile_stub.signed_username,
            "user": {
                "date_joined": profile_stub.user.date_joined.isoformat().replace("+00:00", "Z"),
                "is_active": profile_stub.user.is_active,
                "is_staff": profile_stub.user.is_staff,
                "is_superuser": profile_stub.user.is_superuser,
                "username": profile_stub.user.username,
            },
        }

    def test_retrieve_if_unauthenticated(self, api_client, retrieve_url_path):
        """
        Test that the profile view returns a 401 status code when the user is not authenticated.
        """
        response = api_client.get(retrieve_url_path)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
