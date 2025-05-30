from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.text import Truncator

from ..abstracts import (
    ContextQueryPrompt,
    Created,
    LastProcessed,
    RequestMeta,
    SentimentPolarity,
    SentimentSubjectivity,
    Summary,
    ThreadPath,
    UnprocessableReason,
)
from ... import util


__all__ = (
    "Thread",
    "ThreadContextQuery",
    "ThreadData",
    "UnprocessableThread",
    "UnprocessableThreadContextQuery",
)


class Thread(Created, LastProcessed, ThreadPath):
    """
    Stores a single reddit thread entry. These stats are generated by an LLM based on a prompt.
    """

    def __str__(self):
        return util.format.class__str__(
            self.__class__.__name__,
            last_processed=self.last_processed,
            path=self.path,
        )


class ThreadContextQuery(Created, ContextQueryPrompt, RequestMeta):
    context = models.ForeignKey(
        Thread,
        null=False,
        on_delete=models.CASCADE,
        related_name="context_queries",
        help_text="The reddit thread whose submissions were used to generate the query response.",
    )
    response = models.TextField(
        null=False,
        help_text="The response generated by the LLM based on the context query.",
    )

    def __str__(self):
        return util.format.class__str__(
            self.__class__.__name__,
            context=self.context.path,
            prompt=Truncator(self.prompt).chars(100),
            response=Truncator(self.response).chars(100),
        )


class ThreadData(Created, RequestMeta, SentimentPolarity, SentimentSubjectivity, Summary):
    """
    Stores a single thread data entry. These values are generated by an LLM.
    """

    keywords = ArrayField(
        models.CharField(
            null=False,
        ),
        default=list,
        null=False,
        help_text="The inferred keywords of the thread based on the submissions.",
    )
    thread = models.ForeignKey(
        Thread,
        null=False,
        on_delete=models.CASCADE,
        related_name="data",
        help_text="The reddit thread whose submissions were used to generate the properties of this object.",
    )

    def __str__(self):
        return util.format.class__str__(
            self.__class__.__name__,
            keywords=self.keywords,
            sentiment_polarity=self.sentiment_polarity,
            sentiment_subjectivity=self.sentiment_subjectivity,
            summary=Truncator(self.summary).chars(100),
            thread=self.thread.path,
        )


class UnprocessableThread(Created, ThreadPath, UnprocessableReason):
    """
    Stores a single unprocessable thread entry. A thread is unprocessable if there are not enough
    comments available for processing.
    """

    def __str__(self):
        return util.format.class__str__(
            self.__class__.__name__,
            path=self.path,
            reason=self.reason,
        )


class UnprocessableThreadContextQuery(Created, ThreadPath, UnprocessableReason):
    """
    Stores a single unprocessable thread context query entry. A thread context query is unprocessable if there are not enough
    comments available for processing.
    """

    def __str__(self):
        return util.format.class__str__(
            self.__class__.__name__,
            path=self.path,
            reason=self.reason,
        )
