from urllib.parse import urlparse

from django.db import models


__all__ = (
    "IgnoredRedditor",
    "Redditor",
    "Thread",
    "UnprocessableThread",
    "UnprocessableRedditor",
)


class IgnoredRedditor(models.Model):
    created = models.DateTimeField(
        auto_now=True,
        null=False,
    )
    reason = models.TextField()
    username = models.CharField(
        max_length=32,
        null=False,
        unique=True,
    )


class Redditor(models.Model):
    age = models.IntegerField(
        null=False,
    )
    iq = models.IntegerField(
        null=False,
    )
    last_processed = models.DateTimeField(
        auto_now=True,
        null=False,
    )
    username = models.CharField(
        max_length=32,
        null=False,
        unique=True,
    )


class Thread(models.Model):
    last_processed = models.DateTimeField(
        auto_now=True,
        null=False,
    )
    sentiment_polarity = models.FloatField(
        null=False,
    )
    url = models.URLField(
        null=False,
        unique=True,
    )

    @property
    def path(self):
        return urlparse(self.url).path


class UnprocessableThread(models.Model):
    created = models.DateTimeField(
        auto_now=True,
        null=False,
    )
    reason = models.TextField()
    url = models.URLField(
        null=False,
        unique=True,
    )

    @property
    def path(self):
        return urlparse(self.url).path


class UnprocessableRedditor(models.Model):
    created = models.DateTimeField(
        auto_now=True,
        null=False,
    )
    reason = models.TextField()
    username = models.CharField(
        max_length=32,
        null=False,
        unique=True,
    )
