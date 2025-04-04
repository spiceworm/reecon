import pytest

from reecon import (
    exceptions,
    models,
)


def test_reddit_error():
    with pytest.raises(exceptions.RedditError) as exc_info:
        raise exceptions.RedditError("Reddit error occurred")
    assert str(exc_info.value) == "Reddit error occurred"


def test_unprocessable_entity_error():
    with pytest.raises(exceptions.UnprocessableEntityError) as exc_info:
        raise exceptions.UnprocessableEntityError("Unprocessable entity error occurred")
    assert str(exc_info.value) == "Unprocessable entity error occurred"


def test_unprocessable_redditor_error():
    obj = models.UnprocessableRedditor(username="testuser")
    with pytest.raises(exceptions.UnprocessableRedditorError) as exc_info:
        raise exceptions.UnprocessableRedditorError(username=obj.username, reason="Invalid data", obj=obj)
    assert exc_info.value.username == obj.username
    assert exc_info.value.reason == "Invalid data"
    assert exc_info.value.obj is obj


def test_unprocessable_thread_error():
    obj = models.UnprocessableThread(path="/r/test/doesnot/exist")
    with pytest.raises(exceptions.UnprocessableThreadError) as exc_info:
        raise exceptions.UnprocessableThreadError(path=obj.path, reason="Invalid data", obj=obj)
    assert exc_info.value.path == obj.path
    assert exc_info.value.reason == "Invalid data"
    assert exc_info.value.obj is obj
