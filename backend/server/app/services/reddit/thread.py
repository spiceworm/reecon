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
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)

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
        self, llm_contributor: User, llm_producer: Producer, nlp_contributor: User, nlp_producer: Producer
    ) -> ThreadData | UnprocessableThread:
        """
        Convenience method that executes `get_submissions`, `generate_data`, and `create_object` with the necessary
        arguments.
        """
        try:
            submissions = self.get_submissions(
                max_submissions=config.THREAD_MAX_COMMENTS_PROCESSED,
                min_characters_per_submission=config.CONTENT_FILTER_MIN_LENGTH,
                min_submissions=config.THREAD_MIN_COMMENTS_PROCESSED,
            )
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
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_submissions(
        self, *, max_submissions: int, min_characters_per_submission: int, min_submissions: int
    ) -> List[str]:
        # TODO: include thread.selftext in submissions
        submissions: Set[str] = set()

        ignored_usernames = set(IgnoredRedditor.objects.values_list("username", flat=True))

        praw_submission: Submission = settings.REDDIT_API.submission(url=self.url)

        comment: Comment
        for comment in praw_submission.comments.list():
            if max_submissions <= 0:
                break
            if (
                not isinstance(comment, MoreComments)
                and comment.author
                and comment.author.name not in ignored_usernames
            ):
                if body := self.filter_submission(text=comment.body, min_characters=min_characters_per_submission):
                    max_submissions -= 1
                    submissions.add(body)

        if len(submissions) < min_submissions:
            raise UnprocessableThreadError(
                self.url,
                f"Less than {min_submissions} submissions available for processing (found {len(submissions)})",
            )
        return list(submissions)
