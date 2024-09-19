import logging
from typing import List

from constance import config
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from openai import OpenAIError
from praw.exceptions import RedditAPIException

from .data import (
    GeneratedThreadData,
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
            generated_data: GeneratedThreadData = self.generate_data(
                inputs=submissions,
                llm_name=llm_producer.name,
                nlp_name=nlp_producer.name,
                prompt=config.THREAD_LLM_PROMPT,
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
        try:
            generated_data = super().generate_data(inputs=inputs, llm_name=llm_name, nlp_name=nlp_name, prompt=prompt)
        except OpenAIError as e:
            msg = "OpenAIError thrown when generating data"
            log.exception(msg)
            raise UnprocessableThreadError(self.url, msg)
        else:
            return generated_data

    def get_submissions(
        self, *, max_submissions: int, min_characters_per_submission: int, min_submissions: int
    ) -> List[str]:
        # TODO: should submissions be a set so that all comments found are unique?
        # TODO: include thread.selftext in submissions
        submissions = []

        ignored_usernames = set(IgnoredRedditor.objects.values_list("username", flat=True))

        try:
            praw_submission = settings.REDDIT_API.submission(url=self.url)
            praw_submission.comments.replace_more(limit=None)

            for comment in praw_submission.comments.list():
                if max_submissions <= 0:
                    break
                if comment.author and comment.author.name not in ignored_usernames:
                    if body := self.filter_submission(text=comment.body, min_characters=min_characters_per_submission):
                        max_submissions -= 1
                        submissions.append(body)
        except RedditAPIException as e:
            msg = "RedditAPIException thrown when getting submissions"
            log.exception(msg)
            raise UnprocessableThreadError(self.url, msg)
        else:
            if len(submissions) < min_submissions:
                raise UnprocessableThreadError(
                    self.url,
                    f"Less than {min_submissions} submissions available for processing (found {len(submissions)})",
                )
        return submissions
