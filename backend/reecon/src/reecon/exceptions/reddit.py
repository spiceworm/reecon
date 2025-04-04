from . import ReeconError
from .. import models


__all__ = (
    "RedditError",
    "UnprocessableEntityError",
    "UnprocessableRedditorError",
    "UnprocessableThreadError",
)


class RedditError(ReeconError):
    pass


class UnprocessableEntityError(RedditError):
    pass


class UnprocessableRedditorError(UnprocessableEntityError):
    def __init__(self, username: str, reason: str, obj: models.UnprocessableRedditor):
        super().__init__(reason)
        self.username = username
        self.reason = reason
        self.obj = obj


class UnprocessableThreadError(UnprocessableEntityError):
    def __init__(self, path: str, reason: str, obj: models.UnprocessableThread):
        super().__init__(reason)
        self.path = path
        self.reason = reason
        self.obj = obj
