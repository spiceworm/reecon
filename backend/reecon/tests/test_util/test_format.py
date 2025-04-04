import pytest

from reecon import util


@pytest.mark.django_db
def test_class__str__(redditor_stub):
    formatted = util.format.class__str__(redditor_stub.__class__.__name__, last_processed=redditor_stub.last_processed, username=redditor_stub.username)
    expected = f"Redditor(last_processed={redditor_stub.last_processed}, username={redditor_stub.username})"
    assert formatted == expected
