import pytest
from constance.signals import config_updated
from django.contrib.auth import get_user_model
from unittest.mock import patch

from app.signals import constance_updated

from reecon.models import (
    Profile,
    StatusMessage,
)


@pytest.mark.django_db
class TestAuthUserSavedSignal:
    def test_profile_created_with_new_user(self):
        """Test that a Profile is automatically created when a new user is created."""
        User = get_user_model()

        # Create a new user
        username = "testuser"
        user = User.objects.create_user(username=username, password="password123")

        # Check that a Profile was created for this user
        assert Profile.objects.filter(user=user).exists()
        profile = Profile.objects.get(user=user)
        assert profile.user == user

    def test_profile_not_duplicated_on_user_update(self):
        """Test that updating an existing user doesn't create a duplicate Profile."""
        User = get_user_model()

        user = User.objects.create_user(username="initialusername", password="password123")
        assert Profile.objects.filter(user=user).count() == 1

        # Update the user
        user.username = "updatedusername"
        user.save()

        # Verify no additional Profile was created
        assert Profile.objects.filter(user=user).count() == 1


@pytest.mark.django_db
class TestConstanceUpdatedSignal:
    @pytest.fixture
    def setup_status_messages(self):
        """Create StatusMessage objects needed for testing."""
        for name in ("redditorContextQueryProcessingDisabled", "redditorDataProcessingDisabled", "threadContextQueryProcessingDisabled", "threadDataProcessingDisabled"):
            StatusMessage.objects.create(
                name=name,
                active=True,
                active_is_computed=True,
                category="warning",
                message="",
            )

    @pytest.mark.parametrize(
        "config_key,message_name,new_value,expected_active",
        [
            ("REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED", "redditorContextQueryProcessingDisabled", True, False),
            ("REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED", "redditorContextQueryProcessingDisabled", False, True),
            ("REDDITOR_DATA_PROCESSING_ENABLED", "redditorDataProcessingDisabled", True, False),
            ("REDDITOR_DATA_PROCESSING_ENABLED", "redditorDataProcessingDisabled", False, True),
            ("THREAD_CONTEXT_QUERY_PROCESSING_ENABLED", "threadContextQueryProcessingDisabled", True, False),
            ("THREAD_CONTEXT_QUERY_PROCESSING_ENABLED", "threadContextQueryProcessingDisabled", False, True),
            ("THREAD_DATA_PROCESSING_ENABLED", "threadDataProcessingDisabled", True, False),
            ("THREAD_DATA_PROCESSING_ENABLED", "threadDataProcessingDisabled", False, True),
        ],
    )
    def test_constance_updated(self, config_key, message_name, new_value, expected_active, setup_status_messages):
        """Test constance_updated signal handler updates StatusMessage correctly."""
        # Call the signal handler directly
        constance_updated(sender=None, key=config_key, old_value=not new_value, new_value=new_value)

        # Get the updated StatusMessage
        message = StatusMessage.objects.get(name=message_name)

        # Verify it was updated correctly
        assert message.active == expected_active

    @patch("app.signals.log")
    def test_constance_updated_logging(self, mock_log, setup_status_messages):
        """Test that the signal handler logs the changes."""
        constance_updated(sender=None, key="REDDITOR_DATA_PROCESSING_ENABLED", old_value=False, new_value=True)

        mock_log.debug.assert_called_once()
        assert "StatusMessage" in mock_log.debug.call_args[0][0]
        assert "updated to False" in mock_log.debug.call_args[0][0]

    def test_signal_connection(self):
        """Test that the signal handler is properly connected to the config_updated signal."""
        # Check if our handler is among the receivers for config_updated
        receivers = config_updated._live_receivers(None)
        handler_found = False
        for receiver in receivers:
            if receiver[0].__name__ == "constance_updated":
                handler_found = True
                break

        assert handler_found, "constance_updated handler not connected to config_updated signal"

    def test_unhandled_key(self, setup_status_messages):
        """Test that unhandled keys don't cause errors."""
        # Get initial state of a status message
        message = StatusMessage.objects.get(name="redditorDataProcessingDisabled")
        initial_state = message.active

        # Call the signal handler with an unhandled key
        constance_updated(sender=None, key="UNHANDLED_KEY", old_value=False, new_value=True)

        # Verify that the status message wasn't changed
        message.refresh_from_db()
        assert message.active == initial_state
