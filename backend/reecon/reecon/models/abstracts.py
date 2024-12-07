from urllib.parse import urlparse

from django.db import models


__all__ = (
    "Created",
    "Description",
    "IgnoredReason",
    "LastProcessed",
    "RedditorUsername",
    "ThreadUrl",
    "UnprocessableReason",
)


class Created(models.Model):
    class Meta:
        abstract = True

    created = models.DateTimeField(
        auto_now=True,
        null=False,
        help_text="Date and time of creation.",
    )


class Description(models.Model):
    class Meta:
        abstract = True

    description = models.TextField(
        null=False,
        help_text="Additional description.",
    )


class IgnoredReason(models.Model):
    class Meta:
        abstract = True

    reason = models.TextField(
        help_text="The reason the entity is ignored.",
    )


class LastProcessed(models.Model):
    class Meta:
        abstract = True

    last_processed = models.DateTimeField(
        auto_now=True,
        null=False,
        help_text="Date and time when the entity was last processed.",
    )


class RedditorUsername(models.Model):
    class Meta:
        abstract = True

    username = models.CharField(
        max_length=32,
        null=False,
        unique=True,
        help_text="The username of the redditor.",
    )

    @property
    def identifier(self):
        return self.username

    @property
    def source(self):
        return f"https://old.reddit.com/user/{self.username}"


class ThreadUrl(models.Model):
    class Meta:
        abstract = True

    url = models.URLField(
        null=False,
        unique=True,
        help_text="URL.",
    )

    @property
    def identifier(self):
        return self.path

    @property
    def path(self):
        return urlparse(self.url).path

    @property
    def source(self):
        return f"https://old.reddit.com/{self.path}"


class UnprocessableReason(models.Model):
    class Meta:
        abstract = True

    reason = models.TextField(
        help_text="The reason the entity cannot be processed.",
    )
