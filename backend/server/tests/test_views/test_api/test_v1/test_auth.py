import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from reecon.exceptions import UserSignupConflictException


@pytest.mark.django_db
class TestSignupView:
    @pytest.fixture
    def signup_url_path(self):
        """
        Fixture to provide the URL path for the signup view.
        """
        return reverse("signup")

    def test_signup_success(self, api_client, signup_url_path):
        """
        Test successful signup with valid data.
        """
        signup_data = {
            "username": "testuser",
            "password": "securepassword123",
        }

        response = api_client.post(signup_url_path, signup_data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json() == {
            "is_superuser": response.data["is_superuser"],
            "username": signup_data["username"],
            "is_staff": response.data["is_staff"],
            "is_active": response.data["is_active"],
            "date_joined": response.data["date_joined"],
        }

        User = get_user_model()
        assert User.objects.filter(username=signup_data["username"]).exists()

        user = User.objects.get(username=signup_data["username"])
        assert user.password != signup_data["password"]
        assert user.check_password(signup_data["password"])

    def test_signup_username_conflict(self, api_client, signup_url_path):
        """
        Test signup with an existing username.
        """
        User = get_user_model()
        existing_username = "existinguser"
        User.objects.create_user(username=existing_username, password="password123")

        response = api_client.post(
            path=signup_url_path,
            data={
                "username": existing_username,
                "password": "anotherpassword",
            },
        )

        assert response.status_code == UserSignupConflictException.status_code
        assert response.data["detail"] == UserSignupConflictException.default_detail
        assert User.objects.filter(username=existing_username).count() == 1

    @pytest.mark.parametrize(
        "request_data",
        [
            {"username": "testuser"},  # Missing password
            {"password": "securepassword123"},  # Missing username
            {},  # Empty request
        ],
    )
    def test_signup_invalid_data(self, api_client, request_data, signup_url_path):
        """
        Test signup with invalid data.
        """
        response = api_client.post(signup_url_path, request_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert get_user_model().objects.count() == 0
