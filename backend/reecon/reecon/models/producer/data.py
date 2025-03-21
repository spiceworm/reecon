from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models

from .producer import Producer
from ..abstracts import Created


__all__ = (
    "ProducedBinary",
    "ProducedFloat",
    "ProducedInteger",
    "ProducedText",
    "ProducedTextList",
)


class ProducedBinary(Created):
    """Stores a single produced binary value. Related to :model:`ai.Producer`."""

    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_binary",
        help_text="The user who contributed the resources that produced the data value.",
    )
    producer = models.ForeignKey(
        Producer,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_binary",
        help_text="The producer of value attribute.",
    )
    value = models.BinaryField(
        null=False,
        help_text="The value of the produced binary.",
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(contributor={self.contributor.username}, producer={self.producer.name}, "
            f"value={self.value})"
        )


class ProducedFloat(Created):
    """Stores a single produced float value. Related to :model:`ai.Producer`."""

    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_floats",
        help_text="The user who contributed the resources that produced the data value.",
    )
    producer = models.ForeignKey(
        Producer,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_floats",
        help_text="The producer of the value attribute.",
    )
    value = models.FloatField(
        null=False,
        help_text="The value of the produced float.",
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(contributor={self.contributor.username}, producer={self.producer.name}, "
            f"value={self.value})"
        )


class ProducedInteger(Created):
    """Stores a single produced integer value. Related to :model:`ai.Producer`."""

    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_integers",
        help_text="The user who contributed the resources that produced the data value.",
    )
    producer = models.ForeignKey(
        Producer,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_integers",
        help_text="The producer of the value attribute.",
    )
    value = models.IntegerField(
        null=False,
        help_text="The value of the produced integer.",
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(contributor={self.contributor.username}, producer={self.producer.name}, "
            f"value={self.value})"
        )


class ProducedText(Created):
    """Stores a single produced text value. Related to :model:`ai.Producer`."""

    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_text",
        help_text="The user who contributed the resources that produced the data value.",
    )
    producer = models.ForeignKey(
        Producer,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_text",
        help_text="The producer of the value attribute.",
    )
    value = models.TextField(
        null=False,
        help_text="The value of the produced text.",
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(contributor={self.contributor.username}, producer={self.producer.name}, "
            f"value={self.value})"
        )


class ProducedTextList(Created):
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_text_list",
        help_text="The user who contributed the resources that produced the data value.",
    )
    producer = models.ForeignKey(
        Producer,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_text_list",
        help_text="The producer of the value attribute.",
    )
    value = ArrayField(
        models.CharField(
            null=False,
        ),
        default=list,
        null=False,
        help_text="The value of the produced list of text.",
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(contributor={self.contributor.username}, producer={self.producer.name}, "
            f"value={self.value})"
        )
