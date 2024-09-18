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

    max_input_characters = models.IntegerField(
        null=True,
        help_text="The maximum number of input characters that can be input to the producer.",
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
        on_delete=models.PROTECT,
        related_name="producers",
        help_text="The category of the producer.",
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(max_input_characters={self.max_input_characters}, "
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
