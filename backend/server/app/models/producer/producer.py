from django.db import models

from ..abstracts import (
    Created,
    Description,
)


__all__ = (
    "Producer",
    "ProducerCategory",
)


class Producer(Created, Description):
    """Stores a single data producer. Related to :model:`ai.ProducerCategory`."""

    context_window = models.IntegerField(
        null=True,
        help_text=(
            "The maximum number of tokens that can be used in a single request to the pruducers API, inclusive "
            "of both input and output tokens. For OpenAI models, this number is specified on a per model basis "
            "(https://platform.openai.com/docs/models)."
        ),
    )
    name = models.CharField(
        max_length=255,
        null=False,
        unique=True,
        help_text="The name of the entity used to produce data.",
    )
    category = models.ForeignKey(
        "ProducerCategory",
        null=False,
        on_delete=models.CASCADE,
        related_name="producers",
        help_text="The category of the producer.",
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(context_window={self.context_window}, "
            f"name={self.name}, category={self.category.name})"
        )


class ProducerCategory(Created, Description):
    """Stores a single producer category"""

    name = models.CharField(
        max_length=255,
        null=False,
        unique=True,
        help_text="The name of the producer category.",
    )

    def __str__(self):
        return f"{self.__class__.__name__}(name={self.name})"
