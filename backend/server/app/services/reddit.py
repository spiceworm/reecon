import abc
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
    Redditor as PrawRedditor,  # Avoid name conflict with `app.models.Redditor`
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
import nltk
import validators

from . import producer
from .. import (
    exceptions,
    models,
    schemas,
    util,
)


__all__ = (
    "RedditorDataService",
    "ThreadDataService",
)


log = logging.getLogger("app.services.reddit")


class RedditDataService(abc.ABC):
    TOKENIZER = nltk.data.load("tokenizers/punkt/english.pickle")

    def __init__(
        self,
        *,
        llm_contributor: User,
        llm_producer: models.Producer,
        nlp_contributor: User,
        nlp_producer: models.Producer,
    ):
        self.llm_contributor = llm_contributor
        self.llm_producer = llm_producer
        self.nlp_contributor = nlp_contributor
        self.nlp_producer = nlp_producer

    @abc.abstractmethod
    def create(self, *args, **kwargs):
        pass

    @abc.abstractmethod
    def create_object(self, *args, **kwargs):
        pass

    def generate_data(self, *, inputs: List[str], producer_settings: dict, prompt: str) -> schemas.GeneratedData:
        """
        See docstring in child class methods.
        """
        nlp_service = producer.NlpProducerService(response_format=self.nlp_response_format)
        nlp_data = nlp_service.generate_data(inputs=inputs, nlp_name=self.nlp_producer.name)

        llm_service = producer.LlmProducerService(response_format=self.llm_response_format)
        llm_data = llm_service.generate_data(
            inputs=inputs,
            llm_name=self.llm_producer.name,
            producer_settings=producer_settings,
            prompt=prompt,
        )

        return self.response_format.model_validate({**nlp_data.model_dump(), **llm_data.model_dump()})

    @abc.abstractmethod
    def get_submissions(self, *args, **kwargs):
        pass

    def filter_submission(self, *, text: str) -> str:
        if not text or text == "[deleted]":
            return ""

        # Remove block quotes as they are someone else's words and we do not want them included in
        # the responder's submissions.
        text = util.regex.match_block_quotes.sub("", text)

        # Remove excessive leading and trailing whitespace from each line.
        text = "\n".join(line.strip() for line in text.splitlines())

        # Remove sentences containing URLs while preserving surrounding sentences.
        sentences = []
        for sentence in self.TOKENIZER.tokenize(text):
            include_sentence = True

            for fragment in sentence.split():
                if validators.url(fragment):
                    include_sentence = False
                    break

            if include_sentence:
                sentences.append(sentence)

        retval = " ".join(sentences)

        # Do not process submissions that are either too short or too long.
        if any(
            [
                len(retval) < config.SUBMISSION_FILTER_MIN_LENGTH,
                len(retval) > config.SUBMISSION_FILTER_MAX_LENGTH,
            ]
        ):
            retval = ""

        return retval

    @property
    @abc.abstractmethod
    def llm_response_format(self):
        pass

    @property
    @abc.abstractmethod
    def nlp_response_format(self):
        pass

    @property
    @abc.abstractmethod
    def response_format(self):
        pass


class RedditorDataService(RedditDataService):
    llm_response_format = schemas.LlmGeneratedRedditorData
    nlp_response_format = schemas.NlpGeneratedRedditorData
    response_format = schemas.GeneratedRedditorData

    def __init__(
        self,
        *,
        username: str,
        llm_contributor: User,
        llm_producer: models.Producer,
        nlp_contributor: User,
        nlp_producer: models.Producer,
    ):
        super().__init__(
            llm_contributor=llm_contributor,
            llm_producer=llm_producer,
            nlp_contributor=nlp_contributor,
            nlp_producer=nlp_producer,
        )
        self.username = username

    def create(self, producer_settings: dict) -> models.RedditorData | models.UnprocessableRedditor:
        """
        Convenience method that executes `get_submissions`, `generate_data`, and `create_object` with the necessary
        arguments.
        """
        try:
            submissions = self.get_submissions()
        except exceptions.UnprocessableRedditorError as e:
            log.exception("Unable to process %s", e.username)
            obj, _ = models.UnprocessableRedditor.objects.update_or_create(
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
            generated_data: schemas.GeneratedRedditorData = self.generate_data(
                inputs=submissions,
                producer_settings=producer_settings,
                prompt=config.REDDITOR_LLM_PROMPT,
            )
            obj: models.RedditorData = self.create_object(generated_data=generated_data)
        return obj

    def create_object(self, *, generated_data: schemas.GeneratedRedditorData) -> models.RedditorData:
        """
        Takes all argument objects and associates them as the database schema expects. Returns a :model:`RedditorData`
        object based on those associations.
        """
        redditor, _ = models.Redditor.objects.update_or_create(
            username=self.username,
            defaults={
                "last_processed": timezone.now(),
            },
            create_defaults={
                "last_processed": timezone.now(),
                "username": self.username,
            },
        )
        return models.RedditorData.objects.create(
            age=models.ProducedInteger.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated_data.age,
            ),
            interests=models.ProducedTextList.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated_data.normalized_interests(),
            ),
            iq=models.ProducedInteger.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated_data.iq,
            ),
            redditor=redditor,
            sentiment_polarity=models.ProducedFloat.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated_data.sentiment_polarity,
            ),
            summary=models.ProducedText.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated_data.summary,
            ),
        )

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_submissions(self) -> List[str]:
        submissions: Set[str] = set()
        praw_redditor: PrawRedditor = settings.REDDIT_API.redditor(name=self.username)

        context_window = self.llm_producer.context_window
        max_input_tokens = context_window * config.LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS
        encoding = tiktoken.encoding_for_model(self.llm_producer.name)

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
            raise exceptions.UnprocessableRedditorError(
                self.username,
                f"Less than {config.REDDITOR_MIN_SUBMISSIONS} submissions available for processing "
                f"(found {len(submissions)})",
            )

        return list(submissions)


class ThreadDataService(RedditDataService):
    llm_response_format = schemas.LlmGeneratedThreadData
    nlp_response_format = schemas.NlpGeneratedThreadData
    response_format = schemas.GeneratedThreadData

    def __init__(
        self,
        *,
        url: str,
        llm_contributor: User,
        llm_producer: models.Producer,
        nlp_contributor: User,
        nlp_producer: models.Producer,
    ):
        super().__init__(
            llm_contributor=llm_contributor,
            llm_producer=llm_producer,
            nlp_contributor=nlp_contributor,
            nlp_producer=nlp_producer,
        )
        self.url = url

    def create(self, producer_settings: dict) -> models.ThreadData | models.UnprocessableThread:
        """
        Convenience method that executes `get_submissions`, `generate_data`, and `create_object` with the necessary
        arguments.
        """
        try:
            submissions = self.get_submissions()
        except exceptions.UnprocessableThreadError as e:
            log.exception("Unable to process %s", e.url)
            obj, _ = models.UnprocessableThread.objects.update_or_create(
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
            generated_data: schemas.GeneratedThreadData = self.generate_data(
                inputs=submissions,
                producer_settings=producer_settings,
                prompt=config.THREAD_LLM_PROMPT,
            )
            obj: models.ThreadData = self.create_object(generated_data=generated_data)
        return obj

    def create_object(self, *, generated_data: schemas.GeneratedThreadData) -> models.ThreadData:
        """
        Takes all argument objects and associates them as the database schema expects. Returns a :model:`ThreadData`
        object based on those associations.
        """
        thread, _ = models.Thread.objects.update_or_create(
            url=self.url,
            defaults={
                "last_processed": timezone.now(),
            },
            create_defaults={
                "last_processed": timezone.now(),
                "url": self.url,
            },
        )
        return models.ThreadData.objects.create(
            keywords=models.ProducedTextList.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated_data.normalized_keywords(),
            ),
            sentiment_polarity=models.ProducedFloat.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated_data.sentiment_polarity,
            ),
            summary=models.ProducedText.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated_data.summary,
            ),
            thread=thread,
        )

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_submissions(self) -> List[str]:
        submissions: Set[str] = set()
        ignored_usernames = set(models.IgnoredRedditor.objects.values_list("username", flat=True))
        praw_submission: Submission = settings.REDDIT_API.submission(url=self.url)

        context_window = self.llm_producer.context_window
        max_input_tokens = context_window * config.LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS
        encoding = tiktoken.encoding_for_model(self.llm_producer.name)

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
            raise exceptions.UnprocessableThreadError(
                self.url,
                f"Less than {config.THREAD_MIN_SUBMISSIONS} submissions available for processing "
                f"(found {len(submissions)})",
            )

        return list(submissions)

