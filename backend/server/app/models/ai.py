from django.db import models


__all__ = (
    "Creator",
    "LLM",
)


class Creator(models.Model):
    """
    Stores a single AI creator entry.
    """

    name = models.CharField(max_length=255, help_text="The name of the company/person/entity that creates AI models.")


class LLM(models.Model):
    """
    Stores a single large language model entry, related to :model:`ai.Creator`.
    """

    context_window = models.IntegerField(help_text="The maximum number of input tokens that LLM can take.")
    creator = models.ForeignKey(
        Creator, on_delete=models.CASCADE, related_name="llms", help_text="The creator of the current LLM."
    )
    name = models.CharField(max_length=255, help_text="The name of the LLM.")
