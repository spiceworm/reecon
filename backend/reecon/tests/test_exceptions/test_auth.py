import pytest

from reecon import exceptions


def test_user_signup_conflict_exception():
    def mock_view(request):
        raise exceptions.UserSignupConflictException()

    with pytest.raises(exceptions.UserSignupConflictException) as exc_info:
        mock_view(None)

    assert exc_info.value.status_code == exceptions.UserSignupConflictException.status_code
    assert str(exc_info.value.detail) == exceptions.UserSignupConflictException.default_detail
