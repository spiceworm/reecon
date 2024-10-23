from django.db import models

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
    "ThreadData",
    "UnprocessableThread",
)


class Thread(Created, LastProcessed, ThreadUrl):
    """
    Stores a single reddit thread entry. These stats are generated by an LLM based on a prompt.
    """

    def __str__(self):
        return f"{self.__class__.__name__}(url={self.url})"


class ThreadData(Created):
    """
    Stores a single thread data entry. These values are generated by a producer.
    """

    keywords = models.OneToOneField(
        ProducedTextList,
        null=False,
        on_delete=models.CASCADE,
        related_name="thread_keywords_data",
        help_text="The inferred keywords of the thread based on the submissions.",
    )
    sentiment_polarity = models.OneToOneField(
        ProducedFloat,
        null=False,
        on_delete=models.CASCADE,
        related_name="thread_sentiment_polarity_data",
        help_text="The inferred sentiment polarity of the thread based on the submissions.",
    )
    summary = models.OneToOneField(
        ProducedText,
        null=False,
        on_delete=models.CASCADE,
        related_name="thread_summary_data",
        help_text="The inferred summary of what is being discussed in the thread based on the submissions.",
    )
    thread = models.ForeignKey(
        Thread,
        null=False,
        on_delete=models.CASCADE,
        related_name="data",
        help_text="The reddit thread whose submissions were used to generate the stats in this entry.",
    )

    def __str__(self):
        return (
            f"{self.__class__.__name__}(sentiment_polarity={self.sentiment_polarity.value}, "
            f"summary=..., thread={self.thread.url})"
        )


class UnprocessableThread(Created, ThreadUrl, UnprocessableReason):
    """
    Stores a single unprocessable thread entry. A thread is unprocessable if there are not enough
    comments available for processing.
    """

    def __str__(self):
        return f"{self.__class__.__name__}(url={self.url})"
