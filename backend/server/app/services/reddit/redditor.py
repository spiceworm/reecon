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
    Redditor as PrawRedditor,  # Avoid name conflict with Redditor model
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
    GeneratedRedditorData,
    LlmGeneratedRedditorData,
    NlpGeneratedRedditorData,
    RedditDataService,
)
from ...exceptions import UnprocessableRedditorError
from ...models import (
    Producer,
    ProducedFloat,
    ProducedInteger,
    ProducedText,
    ProducedTextList,
    Redditor,
    RedditorData,
    UnprocessableRedditor,
)

__all__ = ("RedditorDataService",)

log = logging.getLogger("app.services.reddit.redditor")


class RedditorDataService(RedditDataService):
    llm_response_format = LlmGeneratedRedditorData
    nlp_response_format = NlpGeneratedRedditorData
    response_format = GeneratedRedditorData

    def __init__(self, username: str):
        super().__init__()
        self.username = username

    def create(
        self,
        llm_contributor: User,
        llm_producer: Producer,
        nlp_contributor: User,
        nlp_producer: Producer,
        producer_settings: dict,
    ) -> RedditorData | UnprocessableRedditor:
        """
        Convenience method that executes `get_submissions`, `generate_data`, and `create_object` with the necessary
        arguments.
        """
        try:
            submissions = self.get_submissions(llm_producer=llm_producer)
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
            generated_data: GeneratedRedditorData = self.generate_data(
                inputs=submissions,
                llm_name=llm_producer.name,
                nlp_name=nlp_producer.name,
                producer_settings=producer_settings,
                prompt=config.REDDITOR_LLM_PROMPT,
            )
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
            interests=ProducedTextList.objects.create(
                contributor=llm_contributor,
                producer=llm_producer,
                value=generated_data.normalized_interests(),
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

    def generate_data(
        self,
        *,
        inputs: List[str],
        llm_name: str,
        nlp_name: str,
        producer_settings: dict,
        prompt: str,
    ) -> GeneratedRedditorData:
        """
        Takes the input strings and passes them to the nlp and llm services to generate data based on those inputs.
        The response from each of those is a `GeneratedRedditorData`. The output from both nlp and llm processors
        is then combined into a single `GeneratedRedditorData`.
        """
        return super().generate_data(
            inputs=inputs,
            llm_name=llm_name,
            nlp_name=nlp_name,
            producer_settings=producer_settings,
            prompt=prompt,
        )

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_submissions(self, *, llm_producer: Producer) -> List[str]:
        submissions: Set[str] = set()
        praw_redditor: PrawRedditor = settings.REDDIT_API.redditor(name=self.username)

        context_window = llm_producer.context_window
        max_input_tokens = context_window * config.LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS
        encoding = tiktoken.encoding_for_model(llm_producer.name)

        # Get the body of threads submitted by the user.
        thread: Submission
        for thread in praw_redditor.submissions.new():
            if text := self.filter_submission(text=thread.selftext):
                pending_inputs = "|".join(submissions | {text})
                pending_tokens = len(encoding.encode(pending_inputs))
                if pending_tokens < max_input_tokens:
                    submissions.add(text)
                else:
                    break

        # Get the body of comments submitted by the user.
        comment: Comment
        for comment in praw_redditor.comments.new():
            if isinstance(comment, MoreComments):
                continue
            if text := self.filter_submission(text=comment.body):
                pending_inputs = "|".join(submissions | {text})
                pending_tokens = len(encoding.encode(pending_inputs))
                if pending_tokens < max_input_tokens:
                    submissions.add(text)
                else:
                    break

        if len(submissions) < config.REDDITOR_MIN_SUBMISSIONS:
            raise UnprocessableRedditorError(
                self.username,
                f"Less than {config.REDDITOR_MIN_SUBMISSIONS} submissions available for processing "
                f"(found {len(submissions)})",
            )

        return list(submissions)
