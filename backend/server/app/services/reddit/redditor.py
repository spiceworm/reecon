import logging
from typing import List

from constance import config
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from openai import OpenAIError
from praw.exceptions import RedditAPIException

from .data import (
    GeneratedRedditorData,
    RedditDataService,
)
from ...exceptions import UnprocessableRedditorError
from ...models import (
    Producer,
    ProducedFloat,
    ProducedInteger,
    ProducedText,
    Redditor,
    RedditorData,
    UnprocessableRedditor,
)


__all__ = ("RedditorDataService",)


log = logging.getLogger("app.services.reddit.redditor")


class RedditorDataService(RedditDataService):
    response_format = GeneratedRedditorData

    def __init__(self, username: str):
        super().__init__()
        self.username = username

    def create(
        self, llm_contributor: User, llm_producer: Producer, nlp_contributor: User, nlp_producer: Producer
    ) -> RedditorData | UnprocessableRedditor:
        """
        Convenience method that executes `get_submissions`, `generate_data`, and `create_object` with the necessary
        arguments.
        """
        try:
            submissions = self.get_submissions(
                max_characters=llm_producer.max_input_characters,
                min_characters_per_submission=config.CONTENT_FILTER_MIN_LENGTH,
                min_submissions=config.REDDITOR_MIN_SUBMISSIONS,
            )
            generated_data: GeneratedRedditorData = self.generate_data(
                inputs=submissions,
                llm_name=llm_producer.name,
                nlp_name=nlp_producer.name,
                prompt=config.REDDITOR_LLM_PROMPT,
            )
        except UnprocessableRedditorError as e:
            log.exception("Unable to process %s", e.username)
            obj, _ = UnprocessableRedditor.objects.update_or_create(
                username=e.username,
                defaults={
                    "reason": e.reason,
                },
                create_defaults={
                    "reason": e.reason,
                    "username": e.username,
                },
            )
        else:
            obj: RedditorData = self.create_object(
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
        generated_data: GeneratedRedditorData,
        llm_contributor: User,
        llm_producer: Producer,
        nlp_contributor: User,
        nlp_producer: Producer,
    ) -> RedditorData:
        """
        Takes all argument objects and associates them as the database schema expects. Returns a :model:`RedditorData`
        object based on those associations.
        """
        redditor, _ = Redditor.objects.update_or_create(
            username=self.username,
            defaults={
                "last_processed": timezone.now(),
            },
            create_defaults={
                "last_processed": timezone.now(),
                "username": self.username,
            },
        )
        return RedditorData.objects.create(
            age=ProducedInteger.objects.create(
                contributor=llm_contributor,
                producer=llm_producer,
                value=generated_data.age,
            ),
            iq=ProducedInteger.objects.create(
                contributor=llm_contributor,
                producer=llm_producer,
                value=generated_data.iq,
            ),
            redditor=redditor,
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
        )

    def generate_data(self, *, inputs: List[str], llm_name: str, nlp_name: str, prompt: str) -> GeneratedRedditorData:
        """
        Takes the input strings and passes them to the nlp and llm services to generate data based on those inputs.
        The response from each of those is a `GeneratedRedditorData`. The output from both nlp and llm processors
        is then combined into a single `GeneratedRedditorData`.
        """
        try:
            generated_data = super().generate_data(inputs=inputs, llm_name=llm_name, nlp_name=nlp_name, prompt=prompt)
        except OpenAIError as e:
            msg = "OpenAIError thrown when generating data"
            log.exception(msg)
            raise UnprocessableRedditorError(self.username, msg)
        else:
            return generated_data

    def get_submissions(
        self, *, max_characters: int, min_characters_per_submission: int, min_submissions: int
    ) -> List[str]:
        submissions = set()

        try:
            praw_redditor = settings.REDDIT_API.redditor(name=self.username)

            # Get the body of threads submitted by the user.
            for thread in praw_redditor.submissions.new():
                if text := self.filter_submission(text=thread.selftext, min_characters=min_characters_per_submission):
                    if len("|".join(submissions | {text})) < max_characters:
                        submissions.add(text)
                    else:
                        break

            # Get the body of comments submitted by the user.
            for comment in praw_redditor.comments.new():
                if text := self.filter_submission(text=comment.body, min_characters=min_characters_per_submission):
                    if len("|".join(submissions | {text})) < max_characters:
                        submissions.add(text)
                    else:
                        break
        except RedditAPIException as e:
            msg = "RedditAPIException thrown when getting submissions"
            log.exception(msg)
            raise UnprocessableRedditorError(self.username, msg)
        else:
            if len(submissions) < min_submissions:
                raise UnprocessableRedditorError(
                    self.username,
                    f"Less than {min_submissions} submissions available for processing (found {len(submissions)})",
                )
        return list(submissions)
