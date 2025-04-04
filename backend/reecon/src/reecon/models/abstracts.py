from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
)
from django.db import models
from django.utils import timezone


__all__ = (
    "ContextQueryPrompt",
    "Created",
    "Description",
    "IgnoredReason",
    "LastProcessed",
    "RedditorUsername",
    "RequestMeta",
    "SentimentPolarity",
    "SentimentSubjectivity",
    "Summary",
    "ThreadPath",
    "UnprocessableReason",
)


class ContextQueryPrompt(models.Model):
    class Meta:
        abstract = True

    prompt = models.TextField(
        null=False,
        help_text="The prompt used to generate the response.",
    )


class Created(models.Model):
    class Meta:
        abstract = True

    created = models.DateTimeField(
        auto_now_add=True,
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
        default=timezone.now,
        null=False,
        help_text="Date and time when the entity was last processed.",
    )


class RequestMeta(models.Model):
    class Meta:
        abstract = True

    request_meta = models.OneToOneField(
        "RequestMetadata",
        null=False,
        on_delete=models.CASCADE,
        related_name="%(class)s",
        help_text="The metadata associated with the request that initiated processing.",
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


class SentimentPolarity(models.Model):
    class Meta:
        abstract = True
        constraints = [
            models.CheckConstraint(
                check=models.Q(sentiment_polarity__gte=-1.0) & models.Q(sentiment_polarity__lte=1.0),
                name="sentiment_polarity_range",
            )
        ]

    sentiment_polarity = models.FloatField(
        default=0.0,
        null=False,
        validators=[
            MinValueValidator(-1.0),
            MaxValueValidator(1.0),
        ],
        help_text="The inferred sentiment polarity based on the submissions.",
    )


class SentimentSubjectivity(models.Model):
    class Meta:
        abstract = True
        constraints = [
            models.CheckConstraint(
                check=models.Q(sentiment_subjectivity__gte=0.0) & models.Q(sentiment_subjectivity__lte=1.0),
                name="sentiment_subjectivity_range",
            )
        ]

    sentiment_subjectivity = models.FloatField(
        default=0.5,
        null=False,
        validators=[
            MinValueValidator(0.0),
            MaxValueValidator(1.0),
        ],
        help_text="The inferred sentiment subjectivity based on the submissions.",
    )


class Summary(models.Model):
    class Meta:
        abstract = True

    summary = models.TextField(
        null=False,
        help_text="The inferred summary of the entity based on the submissions.",
    )


class ThreadPath(models.Model):
    class Meta:
        abstract = True

    path = models.CharField(
        null=False,
        unique=True,
        help_text="Thread URL path",
    )

    @property
    def identifier(self):
        return self.path

    @property
    def source(self):
        return f"https://old.reddit.com{self.path}"


class UnprocessableReason(models.Model):
    class Meta:
        abstract = True

    reason = models.TextField(
        help_text="The reason the entity cannot be processed.",
    )
