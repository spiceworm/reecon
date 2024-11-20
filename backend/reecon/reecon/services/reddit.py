import abc
import logging
from typing import (
    List,
    Set,
)

from django.contrib.auth.models import User
from django.utils import timezone
import praw
from praw.models import (
    Comment,
    MoreComments,
    Redditor as PrawRedditor,  # Avoid name conflict with `reecon.models.Redditor`
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
    "RedditorContextQueryService",
    "RedditorDataService",
    "ThreadContextQueryService",
    "ThreadDataService",
)

log = logging.getLogger("reecon.services.reddit")


class _RedditService(abc.ABC):
    TOKENIZER = nltk.data.load("tokenizers/punkt/english.pickle")

    def __init__(
        self,
        *,
        identifier: str,
        llm_contributor: User,
        llm_producer: models.Producer,
        nlp_contributor: User,
        nlp_producer: models.Producer,
        producer_settings: dict,
        submitter: User,
        env: schemas.WorkerEnv,
    ):
        self.identifier = identifier
        self.llm_contributor = llm_contributor
        self.llm_producer = llm_producer
        self.nlp_contributor = nlp_contributor
        self.nlp_producer = nlp_producer
        self.producer_settings = producer_settings
        self.submitter = submitter
        self.env = env

        self.reddit_client = praw.Reddit(
            client_id=self.env.reddit.api.client_id,
            client_secret=self.env.reddit.api.client_secret,
            password=self.env.reddit.api.password,
            ratelimit_seconds=self.env.reddit.api.ratelimit_seconds,
            user_agent=self.env.reddit.api.user_agent,
            username=self.env.reddit.api.username,
        )

    @abc.abstractmethod
    def get_inputs(self, *args, **kwargs):
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
                len(retval) < self.env.reddit.submission.min_length,
                len(retval) > self.env.reddit.submission.max_length,
            ]
        ):
            retval = ""

        return retval


class _RedditorService(_RedditService):
    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_inputs(self) -> List[str]:
        submissions: Set[str] = set()
        praw_redditor: PrawRedditor = self.reddit_client.redditor(name=self.identifier)

        context_window = self.llm_producer.context_window
        max_input_tokens = int(context_window * self.env.redditor.llm.max_context_window_for_inputs)
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

        min_submissions = self.env.redditor.submission.min_submissions
        if len(submissions) < min_submissions:
            reason = f"Less than {min_submissions} submissions available for processing (found {len(submissions)})"
            models.UnprocessableRedditor.objects.update_or_create(
                username=self.identifier,
                defaults={
                    "reason": reason,
                },
                create_defaults={
                    "reason": reason,
                    "username": self.identifier,
                },
            )
            raise exceptions.UnprocessableRedditorError(self.identifier, reason)
        return list(submissions)


class _ThreadService(_RedditService):
    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_inputs(self) -> List[str]:
        submissions: Set[str] = set()
        ignored_usernames = set(models.IgnoredRedditor.objects.values_list("username", flat=True))
        praw_submission: Submission = self.reddit_client.submission(url=self.identifier)

        context_window = self.llm_producer.context_window
        max_input_tokens = int(context_window * self.env.thread.llm.max_context_window_for_inputs)
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

        min_submissions = self.env.thread.submission.min_submissions
        if len(submissions) < min_submissions:
            reason = f"Less than {min_submissions} submissions available for processing (found {len(submissions)})"
            models.UnprocessableThread.objects.update_or_create(
                url=self.identifier,
                defaults={
                    "reason": reason,
                },
                create_defaults={
                    "reason": reason,
                    "url": self.identifier,
                },
            )
            raise exceptions.UnprocessableThreadError(self.identifier, reason)
        return list(submissions)


class _ContextQueryService(abc.ABC):
    @abc.abstractmethod
    def create_object(self, *args, **kwargs):
        pass

    @abc.abstractmethod
    def generate(self, *args, **kwargs):
        pass


class _DataService(abc.ABC):
    @abc.abstractmethod
    def create_object(self, *args, **kwargs):
        pass

    @abc.abstractmethod
    def generate(self, *args, **kwargs):
        pass


class RedditorContextQueryService(_ContextQueryService, _RedditorService):
    def create_object(self, generated: schemas.GeneratedRedditorContextQuery) -> models.RedditorContextQuery:
        redditor = models.Redditor.objects.get(username=self.identifier)
        return models.RedditorContextQuery.objects.create(
            context=redditor,
            prompt=generated.prompt,
            response=models.ProducedText.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.response,
            ),
            submitter=self.submitter,
        )

    def generate(self, *, inputs: List[str], prompt: str) -> schemas.GeneratedRedditorContextQuery:
        llm_service = producer.LlmProducerService(response_format=schemas.LlmGeneratedContextQuery)
        llm_data = llm_service.generate_data(
            inputs=inputs,
            llm_name=self.llm_producer.name,
            producer_settings=self.producer_settings,
            prompt=prompt,
        )
        return schemas.GeneratedRedditorContextQuery.model_validate(
            {"inputs": inputs, "prompt": prompt, **llm_data.model_dump()}
        )


class ThreadContextQueryService(_ContextQueryService, _ThreadService):
    def create_object(self, *, generated: schemas.GeneratedThreadContextQuery) -> models.ThreadContextQuery:
        thread = models.Thread.objects.get(url=self.identifier)
        return models.ThreadContextQuery.objects.create(
            context=thread,
            prompt=generated.prompt,
            response=models.ProducedText.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.response,
            ),
            submitter=self.submitter,
        )

    def generate(self, *, inputs: List[str], prompt: str) -> schemas.GeneratedThreadContextQuery:
        llm_service = producer.LlmProducerService(response_format=schemas.LlmGeneratedContextQuery)
        llm_data = llm_service.generate_data(
            inputs=inputs,
            llm_name=self.llm_producer.name,
            producer_settings=self.producer_settings,
            prompt=prompt,
        )
        return schemas.GeneratedThreadContextQuery.model_validate(
            {"inputs": inputs, "prompt": prompt, **llm_data.model_dump()}
        )


class RedditorDataService(_DataService, _RedditorService):
    def create_object(self, *, generated: schemas.GeneratedRedditorData) -> models.RedditorData:
        redditor, _ = models.Redditor.objects.update_or_create(
            username=self.identifier,
            defaults={
                "last_processed": timezone.now(),
                "submitter": self.submitter,
            },
            create_defaults={
                "last_processed": timezone.now(),
                "submitter": self.submitter,
                "username": self.identifier,
            },
        )
        return models.RedditorData.objects.create(
            age=models.ProducedInteger.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.age,
            ),
            interests=models.ProducedTextList.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.normalized_interests(),
            ),
            iq=models.ProducedInteger.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.iq,
            ),
            redditor=redditor,
            sentiment_polarity=models.ProducedFloat.objects.create(
                contributor=self.nlp_contributor,
                producer=self.llm_producer,
                value=generated.sentiment_polarity,
            ),
            summary=models.ProducedText.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.summary,
            ),
        )

    def generate(self, *, inputs: List[str], prompt: str) -> schemas.GeneratedRedditorData:
        nlp_service = producer.NlpProducerService(response_format=schemas.NlpGeneratedRedditorData)
        nlp_data = nlp_service.generate_data(inputs=inputs, nlp_name=self.nlp_producer.name)

        llm_service = producer.LlmProducerService(response_format=schemas.LlmGeneratedRedditorData)
        llm_data = llm_service.generate_data(
            inputs=inputs,
            llm_name=self.llm_producer.name,
            producer_settings=self.producer_settings,
            prompt=prompt,
        )
        return schemas.GeneratedRedditorData.model_validate(
            {
                "inputs": inputs,
                "prompt": prompt,
                **nlp_data.model_dump(),
                **llm_data.model_dump(),
            }
        )


class ThreadDataService(_DataService, _ThreadService):
    def create_object(self, *, generated: schemas.GeneratedThreadData) -> models.ThreadData:
        thread, _ = models.Thread.objects.update_or_create(
            url=self.identifier,
            defaults={
                "last_processed": timezone.now(),
                "submitter": self.submitter,
            },
            create_defaults={
                "last_processed": timezone.now(),
                "submitter": self.submitter,
                "url": self.identifier,
            },
        )
        return models.ThreadData.objects.create(
            keywords=models.ProducedTextList.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.normalized_keywords(),
            ),
            sentiment_polarity=models.ProducedFloat.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.sentiment_polarity,
            ),
            summary=models.ProducedText.objects.create(
                contributor=self.llm_contributor,
                producer=self.llm_producer,
                value=generated.summary,
            ),
            thread=thread,
        )

    def generate(self, *, inputs: List[str], prompt: str) -> schemas.GeneratedThreadData:
        nlp_service = producer.NlpProducerService(response_format=schemas.NlpGeneratedThreadData)
        nlp_data = nlp_service.generate_data(inputs=inputs, nlp_name=self.nlp_producer.name)

        llm_service = producer.LlmProducerService(response_format=schemas.LlmGeneratedThreadData)
        llm_data = llm_service.generate_data(
            inputs=inputs,
            llm_name=self.llm_producer.name,
            producer_settings=self.producer_settings,
            prompt=prompt,
        )
        return schemas.GeneratedThreadData.model_validate(
            {
                "inputs": inputs,
                "prompt": prompt,
                **nlp_data.model_dump(),
                **llm_data.model_dump(),
            }
        )
