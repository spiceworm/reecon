from django.conf import settings
from django.db import models

from .abstracts import Created, Description
from .. import util


__all__ = (
    "LlmProvider",
    "LLM",
    "RequestMetadata",
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
        return util.format.class__str__(
            self.__class__.__name__,
            description=self.description,
            display_name=self.display_name,
            name=self.name,
        )


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
        return util.format.class__str__(
            self.__class__.__name__,
            context_window=self.context_window,
            description=self.description,
            name=self.name,
            provider=self.provider.name,
        )


class RequestMetadata(models.Model):
    contributor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="contributions",
        help_text="The user who contributed resources to pay for LLM processing.",
    )
    input_tokens = models.IntegerField(
        null=False,
        help_text="Number of input tokens.",
    )
    llm = models.ForeignKey(
        LLM,
        null=False,
        on_delete=models.CASCADE,
        related_name="requests_metadata",
        help_text="The LLM used to process the query.",
    )
    output_tokens = models.IntegerField(
        null=False,
        help_text="Number of output tokens.",
    )
    submitter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        on_delete=models.CASCADE,
        related_name="submissions",
        help_text="The user who submit request to initiate the LLM query.",
    )
    total_inputs = models.IntegerField(
        default=0,
        null=False,
        help_text="The total number of unique submissions used as inputs when processing the LLM query.",
    )
    total_tokens = models.IntegerField(
        null=False,
        help_text="Total number of tokens.",
    )

    def __str__(self):
        return util.format.class__str__(
            self.__class__.__name__,
            contributor=self.contributor.username,
            input_tokens=self.input_tokens,
            llm=self.llm.name,
            output_tokens=self.output_tokens,
            submitter=self.submitter.username,
            total_inputs=self.total_inputs,
            total_tokens=self.total_tokens,
        )
