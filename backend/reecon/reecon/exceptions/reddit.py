from . import ReeconError


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
    def __init__(self, username: str, reason: str):
        self.username = username
        self.reason = reason


class UnprocessableThreadError(UnprocessableEntityError):
    def __init__(self, url: str, reason: str):
        self.url = url
        self.reason = reason
