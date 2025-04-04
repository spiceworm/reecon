import pytest


@pytest.mark.django_db
class TestProfile:
    def test_create(self, profile_cls, user_cls):
        obj = profile_cls(
            reddit_username="test_reddit_user",
            user=user_cls(username="testuser", password="testpassword"),
        )
        assert obj.user.username == "testuser"
        assert obj.reddit_username == "test_reddit_user"

    def test_verify_signed_username(self, profile_cls, user_cls):
        obj = profile_cls(
            reddit_username="test_reddit_user",
            user=user_cls(username="testuser", password="testpassword"),
        )

        signed_username = obj.signed_username
        assert obj.verify_signed_username(signed_username) is True

    def test_verify_signed_username_invalid(self, profile_cls, user_cls):
        obj = profile_cls(
            reddit_username="test_reddit_user",
            user=user_cls(username="testuser", password="testpassword"),
        )

        invalid_signed_username = "invalid_signature:testuser"
        assert obj.verify_signed_username(invalid_signed_username) is False

    def test_str(self, profile_cls, user_cls):
        obj = profile_cls(
            reddit_username="test_reddit_user",
            user=user_cls(username="testuser", password="testpassword"),
        )
        expected_str = f"Profile(reddit_username={obj.reddit_username}, user={obj.user.username})"
        assert str(obj) == expected_str
