import logging
import statistics
from typing import List

from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone

from constance import config
import nltk
import openai
import praw
import pydantic
import textblob
import validators

from ..exceptions import (
    UnprocessableRedditorError,
    UnprocessableThreadError,
)
from ..models import (
    LLM,
    Redditor,
    RedditorStats,
    Thread,
    ThreadStats,
    UnprocessableRedditor,
    UnprocessableThread,
)


__all__ = (
    "RedditorService",
    "ThreadService",
)


log = logging.getLogger("app.services.reddit")


class RedditorStatsFormat(pydantic.BaseModel):
    age: int
    confidence: int
    iq: int


class ThreadStatsFormat(pydantic.BaseModel):
    sentiment_polarity: float


class RedditBase:
    API = praw.Reddit(**settings.REDDIT_API_SETTINGS)


class RedditorService(RedditBase):
    def __init__(self, username: str):
        self.username = username
        self.praw_redditor = praw.models.PrawRedditor = self.API.redditor(name=username)

    def get_submissions(
        self, *, max_characters: int, min_characters_per_submission: int, min_submissions: int
    ) -> List[str]:
        submissions = set()

        # Get the body of threads submitted by the user.
        for thread in self.praw_redditor.submissions.new():
            thread_submission = SubmissionService(thread.selftext)
            if filtered_text := thread_submission.filter(min_characters=min_characters_per_submission):
                if len('|'.join(submissions | {filtered_text})) < max_characters:
                    submissions.add(filtered_text)
                else:
                    break

        # Get the body of comments submitted by the user.
        for comment in self.praw_redditor.comments.new():
            comment_submission = SubmissionService(comment.body)
            if filtered_text := comment_submission.filter(min_characters=min_characters_per_submission):
                if len('|'.join(submissions | {filtered_text})) < max_characters:
                    submissions.add(filtered_text)
                else:
                    break

        if len(submissions) < min_submissions:
            raise UnprocessableRedditorError(
                self.username,
                f"Less than {min_submissions} submissions available for processing (found {len(submissions)})",
            )
        return list(submissions)

    def infer_stats(self, *, llm_name: str, input_content: str, input_prompt: str):
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        try:
            chat_completion = client.beta.chat.completions.parse(
                messages=[
                    {
                        "role": "system",
                        "content": input_prompt,
                    },
                    {
                        "role": "user",
                        "content": input_content,
                    },
                ],
                model=llm_name,
                response_format=RedditorStatsFormat,
            )
        except openai.OpenAIError:
            log.exception(f"Error thrown processing chat: %s", input_content)
            raise UnprocessableRedditorError(self.username, "OpenAIError thrown when processing submissions")
        else:
            return chat_completion.choices[0].message.parsed

    def process(self, purchaser_username: str) -> None:
        llm = LLM.objects.filter(name=config.OPENAI_MODEL).first()

        try:
            submissions = self.get_submissions(
                max_characters=llm.context_window,
                min_characters_per_submission=config.CONTENT_FILTER_MIN_LENGTH,
                min_submissions=config.REDDITOR_MIN_SUBMISSIONS,
            )
            stats = self.infer_stats(
                llm_name=llm.name,
                input_content="|".join(submissions),
                input_prompt=config.REDDITOR_LLM_STATS_PROMPT,
            )
        except UnprocessableRedditorError as e:
            log.exception("Unable to process %s", e.username)
            UnprocessableRedditor.objects.update_or_create(
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
            purchaser = User.objects.filter(username=purchaser_username).first()
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
            RedditorStats.objects.create(
                age=stats.age,
                confidence=stats.confidence,
                iq=stats.iq,
                llm=llm,
                purchaser=purchaser,
                redditor=redditor,
            )


class SubmissionService:
    TOKENIZER = nltk.data.load("tokenizers/punkt/english.pickle")

    def __init__(self, text: str):
        self.text = text

    def filter(self, *, min_characters: int) -> str:
        if not self.text or self.text == "[deleted]":
            return ""

        # Remove sentences containing URLs while preserving surrounding sentences.
        sentences = []
        for sentence in self.TOKENIZER.tokenize(self.text):
            include_sentence = True

            for fragment in sentence.split():
                if validators.url(fragment):
                    include_sentence = False
                    break

            if include_sentence:
                sentences.append(sentence)

        retval = " ".join(sentences)

        # Do not process short comments.
        if len(retval) < min_characters:
            retval = ""

        return retval


class ThreadService(RedditBase):
    def __init__(self, url: str):
        self.url = url
        self.praw_submission: praw.models.Submission = self.API.submission(url=url)
        self.praw_submission.comments.replace_more(limit=None)

    def get_submissions(
        self, *, max_submissions: int, min_characters_per_submission: int, min_submissions: int
    ) -> List[str]:
        # TODO: should submissions be a set so that all comments found are unique?
        # TODO: include thread.selftext in submissions
        submissions = []

        for comment in self.praw_submission.comments.list():
            if max_submissions <= 0:
                break
            if comment.author:
                comment_submission = SubmissionService(comment.body)
                if body := comment_submission.filter(min_characters=min_characters_per_submission):
                    max_submissions -= 1
                    submissions.append(body)

        if len(submissions) < min_submissions:
            raise UnprocessableThreadError(
                self.url,
                f"Less than {min_submissions} submissions available for processing (found {len(submissions)})",
            )
        return submissions

    def infer_stats(self, *, input_content: List[str]) -> ThreadStatsFormat:
        polarity_values = []
        for text in input_content:
            blob = textblob.TextBlob(text)
            polarity_values.append(blob.sentiment.polarity)
        sentiment_polarity = statistics.mean(polarity_values)
        return ThreadStatsFormat.model_validate({"sentiment_polarity": sentiment_polarity})

    def process(self) -> None:
        try:
            submissions = self.get_submissions(
                max_submissions=config.THREAD_MAX_COMMENTS_PROCESSED,
                min_characters_per_submission=config.CONTENT_FILTER_MIN_LENGTH,
                min_submissions=config.THREAD_MIN_COMMENTS_PROCESSED,
            )
            stats = self.infer_stats(
                input_content=submissions,
            )
        except UnprocessableThreadError as e:
            log.exception("Unable to process %s", e.url)
            UnprocessableThread.objects.update_or_create(
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
            ThreadStats.objects.create(
                sentiment_polarity=stats.sentiment_polarity,
                thread=thread,
            )
