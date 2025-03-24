from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models

from .abstracts import Created, Description


__all__ = (
    "LlmProvider",
    "LLM",
    "ProducedBinary",
    "ProducedFloat",
    "ProducedInteger",
    "ProducedText",
    "ProducedTextList",
)


class LlmProvider(Created, Description):
    display_name = models.CharField(
        null=False,
        unique=True,
    )
    name = models.CharField(
        null=False,
        unique=True,
    )

    def __str__(self):
        return f"{self.__class__.__name__}(name={self.name}, display_name={self.display_name})"


class LLM(Created, Description):
    name = models.CharField(
        null=False,
        unique=True,
    )
    provider = models.ForeignKey(
        LlmProvider,
        null=False,
        on_delete=models.CASCADE,
        related_name="llms",
    )
    context_window = models.IntegerField(
        null=False,
    )

    def __str__(self):
        return f"{self.__class__.__name__}(name={self.name}, provider={self.provider.name})"


class ProducedBinary(Created):
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_binary",
        help_text="The user who contributed the resources that produced the data value.",
    )
    llm = models.ForeignKey(
        LLM,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_binary",
    )
    value = models.BinaryField(
        null=False,
    )

    def __str__(self):
        return f"{self.__class__.__name__}(contributor={self.contributor.username}, llm={self.llm.name}, " f"value={self.value})"


class ProducedFloat(Created):
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_floats",
        help_text="The user who contributed the resources that produced the data value.",
    )
    llm = models.ForeignKey(
        LLM,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_floats",
    )
    value = models.FloatField(
        null=False,
    )

    def __str__(self):
        return f"{self.__class__.__name__}(contributor={self.contributor.username}, llm={self.llm.name}, " f"value={self.value})"


class ProducedInteger(Created):
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_integers",
        help_text="The user who contributed the resources that produced the data value.",
    )
    llm = models.ForeignKey(
        LLM,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_integers",
    )
    value = models.IntegerField(
        null=False,
    )

    def __str__(self):
        return f"{self.__class__.__name__}(contributor={self.contributor.username}, llm={self.llm.name}, " f"value={self.value})"


class ProducedText(Created):
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_text",
        help_text="The user who contributed the resources that produced the data value.",
    )
    llm = models.ForeignKey(
        LLM,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_text",
    )
    value = models.TextField(
        null=False,
    )

    def __str__(self):
        return f"{self.__class__.__name__}(contributor={self.contributor.username}, llm={self.llm.name}, " f"value={self.value})"


class ProducedTextList(Created):
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributed_text_lists",
        help_text="The user who contributed the resources that produced the data value.",
    )
    llm = models.ForeignKey(
        LLM,
        null=False,
        on_delete=models.CASCADE,
        related_name="produced_text_lists",
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
        return f"{self.__class__.__name__}(contributor={self.contributor.username}, llm={self.llm.name}, " f"value={self.value})"
