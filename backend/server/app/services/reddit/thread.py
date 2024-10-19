import logging
from typing import (
    List,
    Set,
)

from constance import config
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from praw.models import (
    Comment,
    MoreComments,
    Submission,
)
from prawcore.exceptions import TooManyRequests
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)
import tiktoken

from .data import (
    GeneratedThreadData,
    LlmGeneratedThreadData,
    NlpGeneratedThreadData,
    RedditDataService,
)
from ...exceptions import (
    UnprocessableThreadError,
)
from ...models import (
    IgnoredRedditor,
    Producer,
    ProducedFloat,
    ProducedText,
    ProducedTextList,
    Thread,
    ThreadData,
    UnprocessableThread,
)


__all__ = ("ThreadDataService",)


log = logging.getLogger("app.services.reddit.thread")


class ThreadDataService(RedditDataService):
    llm_response_format = LlmGeneratedThreadData
    nlp_response_format = NlpGeneratedThreadData
    response_format = GeneratedThreadData

    def __init__(self, url: str):
        super().__init__()
        self.url = url

    def create(
        self,
        llm_contributor: User,
        llm_producer: Producer,
        nlp_contributor: User,
        nlp_producer: Producer,
    ) -> ThreadData | UnprocessableThread:
        """
        Convenience method that executes `get_submissions`, `generate_data`, and `create_object` with the necessary
        arguments.
        """
        try:
            submissions = self.get_submissions(llm_producer=llm_producer)
        except UnprocessableThreadError as e:
            log.exception("Unable to process %s", e.url)
            obj, _ = UnprocessableThread.objects.update_or_create(
                url=self.url,
                defaults={
                    "reason": e.reason,
                },
                create_defaults={
                    "reason": e.reason,
                    "url": e.url,
                },
            )
        else:
            generated_data: GeneratedThreadData = self.generate_data(
                inputs=submissions,
                llm_name=llm_producer.name,
                nlp_name=nlp_producer.name,
                prompt=config.THREAD_LLM_PROMPT,
            )
            obj: ThreadData = self.create_object(
                generated_data=generated_data,
                llm_contributor=llm_contributor,
                llm_producer=llm_producer,
                nlp_contributor=nlp_contributor,
                nlp_producer=nlp_producer,
            )
        return obj

    def create_object(
        self,
        *,
        generated_data: GeneratedThreadData,
        llm_contributor: User,
        llm_producer: Producer,
        nlp_contributor: User,
        nlp_producer: Producer,
    ) -> ThreadData:
        """
        Takes all argument objects and associates them as the database schema expects. Returns a :model:`ThreadData`
        object based on those associations.
        """
        thread, _ = Thread.objects.update_or_create(
            url=self.url,
            defaults={
                "last_processed": timezone.now(),
            },
            create_defaults={
                "last_processed": timezone.now(),
                "url": self.url,
            },
        )
        return ThreadData.objects.create(
            keywords=ProducedTextList.objects.create(
                contributor=llm_contributor,
                producer=llm_producer,
                value=generated_data.normalized_keywords(),
            ),
            sentiment_polarity=ProducedFloat.objects.create(
                contributor=nlp_contributor,
                producer=nlp_producer,
                value=generated_data.sentiment_polarity,
            ),
            summary=ProducedText.objects.create(
                contributor=llm_contributor,
                producer=llm_producer,
                value=generated_data.summary,
            ),
            thread=thread,
        )

    def generate_data(self, *, inputs: List[str], llm_name: str, nlp_name: str, prompt: str) -> GeneratedThreadData:
        """
        Takes the input strings and passes them to the nlp and llm services to generate data based on those inputs.
        The response from each of those is a `GeneratedThreadData`. The output from both nlp and llm processors
        is then combined into a single `GeneratedThreadData`.
        """
        return super().generate_data(inputs=inputs, llm_name=llm_name, nlp_name=nlp_name, prompt=prompt)

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_submissions(self, *, llm_producer: Producer) -> List[str]:
        submissions: Set[str] = set()
        ignored_usernames = set(IgnoredRedditor.objects.values_list("username", flat=True))
        praw_submission: Submission = settings.REDDIT_API.submission(url=self.url)

        context_window = llm_producer.context_window
        max_input_tokens = context_window * config.LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS
        encoding = tiktoken.encoding_for_model(llm_producer.name)

        # Get the thread selftext
        if text := self.filter_submission(text=praw_submission.selftext):
            pending_inputs = "|".join(submissions | {text})
            pending_tokens = len(encoding.encode(pending_inputs))
            if pending_tokens < max_input_tokens:
                submissions.add(text)

        # Get thread comments
        comment: Comment
        for comment in praw_submission.comments.list():
            if isinstance(comment, MoreComments):
                continue
            if comment.author and comment.author.name not in ignored_usernames:
                if text := self.filter_submission(text=comment.body):
                    pending_inputs = "|".join(submissions | {text})
                    pending_tokens = len(encoding.encode(pending_inputs))
                    if pending_tokens < max_input_tokens:
                        submissions.add(text)
                    else:
                        break

        if len(submissions) < config.THREAD_MIN_SUBMISSIONS:
            raise UnprocessableThreadError(
                self.url,
                f"Less than {config.THREAD_MIN_SUBMISSIONS} submissions available for processing "
                f"(found {len(submissions)})",
            )

        return list(submissions)
