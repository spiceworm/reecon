import abc
import datetime as dt
import logging
from typing import List

from django.utils import timezone
import praw
from praw.models import (
    Comment,
    MoreComments,
    Redditor as PrawRedditor,  # Avoid name conflict with `reecon.models.Redditor`
    Submission,
)
from praw.exceptions import InvalidURL
from prawcore.exceptions import (
    Forbidden,
    NotFound,
    TooManyRequests,
)
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)

from . import llm_provider
from .. import (
    exceptions,
    models,
    schemas,
    types,
    util,
)


__all__ = (
    "RedditorContextQueryService",
    "RedditorDataService",
    "ThreadContextQueryService",
    "ThreadDataService",
)

log = logging.getLogger("reecon.services.reddit")


class RedditBase(abc.ABC):
    def __init__(
        self,
        *,
        identifier: str,
        contributor: models.AppUser,
        llm: models.LLM,
        llm_providers_settings: types.LlmProvidersSettings,
        submitter: models.AppUser,
        env: schemas.WorkerEnv,
    ):
        self.identifier = identifier
        self.contributor = contributor
        self.llm = llm
        llm_provider_cls = llm_provider.cls_from_name(llm.provider.name)
        self.llm_provider = llm_provider_cls(api_key=llm_providers_settings[llm.provider.name]["api_key"])
        self.submitter = submitter
        self.env = env

        self.reddit_client = praw.Reddit(
            client_id=self.env.reddit.api.client_id,
            client_secret=self.env.reddit.api.client_secret,
            ratelimit_seconds=self.env.reddit.api.ratelimit_seconds,
            user_agent=self.env.reddit.api.user_agent,
        )

    @abc.abstractmethod
    def get_inputs(self) -> List[str]:
        pass

    def sanitize_submission(self, s: str) -> str:
        return util.inputs.sanitize(s, min_length=self.env.reddit.submission.min_length, max_length=self.env.reddit.submission.max_length, disallowed_strings=("[deleted]",))

    @abc.abstractmethod
    def unprocessable_entity(self, reason: str) -> exceptions.UnprocessableEntityError:
        pass


class RedditorBase(RedditBase):
    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_inputs(self) -> List[str]:
        submissions: List[str] = []
        praw_redditor: PrawRedditor = self.reddit_client.redditor(name=self.identifier)

        max_input_tokens = int(self.llm.context_window * self.env.redditor.llm.max_context_window_for_inputs)

        try:
            # Check if the redditor account is old enough to be processed
            try:
                created_utc = praw_redditor.created_utc
            except AttributeError:
                raise self.unprocessable_entity("Inaccessible account")
            else:
                created_ts = dt.datetime.fromtimestamp(created_utc).replace(tzinfo=dt.UTC)
                current_ts = dt.datetime.now(dt.UTC)

                if current_ts - created_ts < self.env.redditor.account.min_age:
                    raise self.unprocessable_entity(f"Account age is less than {self.env.redditor.account.min_age} old")

            # Get the body of threads submitted by the user.
            thread: Submission
            for thread in praw_redditor.submissions.new():
                if text := self.sanitize_submission(thread.selftext):
                    if text not in submissions:
                        pending_inputs = "|".join(submissions + [text])
                        pending_tokens = self.llm_provider.count_tokens(pending_inputs, self.llm.name)
                        if pending_tokens < max_input_tokens:
                            submissions.append(text)
                        else:
                            break

            # Get the body of comments submitted by the user.
            comment: Comment
            for comment in praw_redditor.comments.new():
                if isinstance(comment, MoreComments):
                    continue
                if text := self.sanitize_submission(comment.body):
                    if text not in submissions:
                        pending_inputs = "|".join(submissions + [text])
                        pending_tokens = self.llm_provider.count_tokens(pending_inputs, self.llm.name)
                        if pending_tokens < max_input_tokens:
                            submissions.append(text)
                        else:
                            break
        except (Forbidden, NotFound) as e:
            raise self.unprocessable_entity(str(e))

        min_submissions = self.env.redditor.submission.min_submissions
        if len(submissions) < min_submissions:
            raise self.unprocessable_entity(f"Less than {min_submissions} submissions available for processing (found {len(submissions)})")
        return submissions

    def unprocessable_entity(self, reason):
        obj, _ = models.UnprocessableRedditor.objects.update_or_create(
            username=self.identifier,
            defaults={
                "reason": reason,
                "submitter": self.submitter,
            },
            create_defaults={
                "reason": reason,
                "submitter": self.submitter,
                "username": self.identifier,
            },
        )
        return exceptions.UnprocessableRedditorError(self.identifier, reason, obj)


class ThreadBase(RedditBase):
    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_exception_type(TooManyRequests),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def get_inputs(self) -> List[str]:
        submissions: List[str] = []
        ignored_usernames = set(models.IgnoredRedditor.objects.values_list("username", flat=True))

        try:
            praw_submission: Submission = self.reddit_client.submission(url=self.identifier)
        except InvalidURL as e:
            raise self.unprocessable_entity(str(e))

        max_input_tokens = int(self.llm.context_window * self.env.thread.llm.max_context_window_for_inputs)

        try:
            # Get the thread selftext
            if text := self.sanitize_submission(praw_submission.selftext):
                if text not in submissions:
                    pending_inputs = "|".join(submissions + [text])
                    pending_tokens = self.llm_provider.count_tokens(pending_inputs, self.llm.name)
                    if pending_tokens < max_input_tokens:
                        submissions.append(text)

            # Get thread comments
            comment: Comment
            for comment in praw_submission.comments.list():
                if isinstance(comment, MoreComments):
                    continue
                if comment.author and comment.author.name not in ignored_usernames:
                    if text := self.sanitize_submission(comment.body):
                        if text not in submissions:
                            pending_inputs = "|".join(submissions + [text])
                            pending_tokens = self.llm_provider.count_tokens(pending_inputs, self.llm.name)
                            if pending_tokens < max_input_tokens:
                                submissions.append(text)
                            else:
                                break
        except NotFound as e:
            raise self.unprocessable_entity(str(e))

        min_submissions = self.env.thread.submission.min_submissions
        if len(submissions) < min_submissions:
            raise self.unprocessable_entity(f"Less than {min_submissions} submissions available for processing (found {len(submissions)})")
        return submissions

    def unprocessable_entity(self, reason):
        obj, _ = models.UnprocessableThread.objects.update_or_create(
            url=self.identifier,
            defaults={
                "reason": reason,
                "submitter": self.submitter,
            },
            create_defaults={
                "reason": reason,
                "submitter": self.submitter,
                "url": self.identifier,
            },
        )
        return exceptions.UnprocessableThreadError(self.identifier, reason, obj)


class LlmActionBase(abc.ABC):
    @abc.abstractmethod
    def create_object(self, *args, **kwargs):
        pass

    @abc.abstractmethod
    def generate(self, *args, **kwargs):
        pass


class RedditorContextQueryService(LlmActionBase, RedditorBase):
    def create_object(self, generated: schemas.GeneratedRedditorContextQuery) -> models.RedditorContextQuery:
        redditor = models.Redditor.objects.get(username=self.identifier)
        return models.RedditorContextQuery.objects.create(
            context=redditor,
            prompt=generated.prompt,
            response=models.ProducedText.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.response,
            ),
            submitter=self.submitter,
            total_inputs=len(generated.inputs),
        )

    def generate(self, *, inputs: List[str], prompt: str) -> schemas.GeneratedRedditorContextQuery:
        generated_data = self.llm_provider.generate_data(inputs=inputs, llm_name=self.llm.name, prompt=prompt, response_format=schemas.GeneratedRedditorContextQuery)
        log.debug("Retry stats: %s", self.llm_provider.generate_data.retry.statistics)
        return schemas.GeneratedRedditorContextQuery.model_validate({"inputs": inputs, "prompt": prompt, **generated_data.model_dump()})


class ThreadContextQueryService(LlmActionBase, ThreadBase):
    def create_object(self, *, generated: schemas.GeneratedThreadContextQuery) -> models.ThreadContextQuery:
        thread = models.Thread.objects.get(url=self.identifier)
        return models.ThreadContextQuery.objects.create(
            context=thread,
            prompt=generated.prompt,
            response=models.ProducedText.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.response,
            ),
            submitter=self.submitter,
            total_inputs=len(generated.inputs),
        )

    def generate(self, *, inputs: List[str], prompt: str) -> schemas.GeneratedThreadContextQuery:
        generated_data = self.llm_provider.generate_data(
            inputs=inputs,
            llm_name=self.llm.name,
            prompt=prompt,
            response_format=schemas.GeneratedThreadContextQuery,
        )
        log.debug("Retry stats: %s", self.llm_provider.generate_data.retry.statistics)
        return schemas.GeneratedThreadContextQuery.model_validate({"inputs": inputs, "prompt": prompt, **generated_data.model_dump()})


class RedditorDataService(LlmActionBase, RedditorBase):
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
                contributor=self.contributor,
                llm=self.llm,
                value=generated.age,
            ),
            interests=models.ProducedTextList.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.normalized_interests(),
            ),
            iq=models.ProducedInteger.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.iq,
            ),
            redditor=redditor,
            sentiment_polarity=models.ProducedFloat.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.sentiment_polarity,
            ),
            sentiment_subjectivity=models.ProducedFloat.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.sentiment_subjectivity,
            ),
            summary=models.ProducedText.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.summary,
            ),
            total_inputs=len(generated.inputs),
        )

    def generate(self, *, inputs: List[str], prompt: str) -> schemas.GeneratedRedditorData:
        generated_data = self.llm_provider.generate_data(
            inputs=inputs,
            llm_name=self.llm.name,
            prompt=prompt,
            response_format=schemas.GeneratedRedditorData,
        )
        log.debug("Retry stats: %s", self.llm_provider.generate_data.retry.statistics)
        return schemas.GeneratedRedditorData.model_validate(
            {
                "inputs": inputs,
                "prompt": prompt,
                **generated_data.model_dump(),
            }
        )


class ThreadDataService(LlmActionBase, ThreadBase):
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
                contributor=self.contributor,
                llm=self.llm,
                value=generated.normalized_keywords(),
            ),
            sentiment_polarity=models.ProducedFloat.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.sentiment_polarity,
            ),
            sentiment_subjectivity=models.ProducedFloat.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.sentiment_subjectivity,
            ),
            summary=models.ProducedText.objects.create(
                contributor=self.contributor,
                llm=self.llm,
                value=generated.summary,
            ),
            thread=thread,
            total_inputs=len(generated.inputs),
        )

    def generate(self, *, inputs: List[str], prompt: str) -> schemas.GeneratedThreadData:
        generated_data = self.llm_provider.generate_data(
            inputs=inputs,
            llm_name=self.llm.name,
            prompt=prompt,
            response_format=schemas.GeneratedThreadData,
        )
        log.debug("Retry stats: %s", self.llm_provider.generate_data.retry.statistics)
        return schemas.GeneratedThreadData.model_validate(
            {
                "inputs": inputs,
                "prompt": prompt,
                **generated_data.model_dump(),
            }
        )
