from django.contrib.auth.models import User
from django.db import models
from django.utils.text import Truncator

from .. import (
    ProducedFloat,
    ProducedText,
    ProducedTextList,
)
from ..abstracts import (
    Created,
    LastProcessed,
    ThreadUrl,
    UnprocessableReason,
)


__all__ = (
    "Thread",
    "ThreadContextQuery",
    "ThreadData",
    "UnprocessableThread",
)


class Thread(Created, LastProcessed, ThreadUrl):
    """
    Stores a single reddit thread entry. These stats are generated by an LLM based on a prompt.
    """

    submitter = models.ForeignKey(
        User,
        null=False,
        on_delete=models.CASCADE,
        related_name="submitted_threads",
        help_text="The user who submit the thread for processing.",
    )

    def __str__(self):
        return f"{self.__class__.__name__}(url={self.url}, submitter={self.submitter.username})"


class ThreadContextQuery(Created):
    context = models.ForeignKey(
        Thread,
        null=False,
        on_delete=models.CASCADE,
        related_name="context_queries",
        help_text="The reddit thread whose submissions were used to generate the query response.",
    )
    prompt = models.TextField(
        null=False,
    )
    response = models.OneToOneField(
        ProducedText,
        null=False,
        on_delete=models.CASCADE,
        related_name="response_thread_context_query",
    )
    submitter = models.ForeignKey(
        User,
        null=False,
        on_delete=models.CASCADE,
        related_name="submitted_thread_context_queries",
        help_text="The user who submit the context query for processing.",
    )
    total_inputs = models.IntegerField(
        default=0, null=False, help_text="The total number of inputs used when processing the context query."
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(context={self.context.url}, submitter={self.submitter.username}, "
            f"prompt={Truncator(self.prompt).chars(100)}, response={Truncator(self.response).chars(100)}), "
            f"total_inputs={self.total_inputs}"
        )


class ThreadData(Created):
    """
    Stores a single thread data entry. These values are generated by a producer.
    """

    keywords = models.OneToOneField(
        ProducedTextList,
        null=False,
        on_delete=models.CASCADE,
        related_name="keywords_thread_data",
        help_text="The inferred keywords of the thread based on the submissions.",
    )
    sentiment_polarity = models.OneToOneField(
        ProducedFloat,
        default=0.0,  # Possible range is [-1.0, 1.0]
        null=False,
        on_delete=models.CASCADE,
        related_name="sentiment_polarity_thread_data",
        help_text="The inferred sentiment polarity of the thread based on the submissions.",
    )
    sentiment_subjectivity = models.OneToOneField(
        ProducedFloat,
        default=0.5,  # Possible range is [0.0, 1.0]
        null=False,
        on_delete=models.CASCADE,
        related_name="sentiment_subjectivity_thread_data",
        help_text="The inferred sentiment subjectivity of the thread based on the submissions.",
    )
    summary = models.OneToOneField(
        ProducedText,
        null=False,
        on_delete=models.CASCADE,
        related_name="summary_thread_data",
        help_text="The inferred summary of what is being discussed in the thread based on the submissions.",
    )
    thread = models.ForeignKey(
        Thread,
        null=False,
        on_delete=models.CASCADE,
        related_name="data",
        help_text="The reddit thread whose submissions were used to generate the stats in this entry.",
    )
    total_inputs = models.IntegerField(
        default=0, null=False, help_text="The total number of inputs used when processing the data."
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(keywords={self.keywords.value}, sentiment_polarity={self.sentiment_polarity.value}, "
            f"sentiment_subjectivity={self.sentiment_subjectivity.value}, summary={Truncator(self.summary.value).chars(100)}, "
            f"thread={self.thread.url}), total_inputs={self.total_inputs}"
        )


class UnprocessableThread(Created, ThreadUrl, UnprocessableReason):
    """
    Stores a single unprocessable thread entry. A thread is unprocessable if there are not enough
    comments available for processing.
    """

    submitter = models.ForeignKey(
        User,
        null=False,
        on_delete=models.CASCADE,
        related_name="submitted_unprocessable_threads",
        help_text="The user who submit the unprocessable thread for processing.",
    )

    def __str__(self):
        return f"{self.__class__.__name__}(url={self.url}, submitter={self.submitter.username})"
