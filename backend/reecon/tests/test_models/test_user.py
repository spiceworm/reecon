import pytest


@pytest.mark.django_db
def test_create_app_user(user_cls):
    obj = user_cls(username="testuser", password="testpassword")
    assert obj.username == "testuser"
    assert obj.check_password("testpassword")
