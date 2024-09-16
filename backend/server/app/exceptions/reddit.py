from . import AppError


__all__ = (
    "RedditError",
    "UnprocessableRedditorError",
    "UnprocessableThreadError",
)


class RedditError(AppError):
    pass


class UnprocessableRedditorError(RedditError):
    def __init__(self, username: str, reason: str):
        self.username = username
        self.reason = reason


class UnprocessableThreadError(RedditError):
    def __init__(self, url: str, reason: str):
        self.url = url
        self.reason = reason
