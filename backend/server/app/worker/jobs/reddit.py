import json
import logging
import statistics

from constance import config
from django.conf import settings
from django.utils import timezone
import nltk.data
import openai
import praw
from praw.models import Submission
from praw.models import Redditor as PrawRedditor  # prevent name conflict with app model
import textblob
import validators

from ...models import (
    Redditor,
    Thread,
    UnprocessableRedditor,
    UnprocessableThread,
)


log = logging.getLogger("app")


TOKENIZER = nltk.data.load("tokenizers/punkt/english.pickle")
REDDITOR_DETAILS_PROMPT = (
    "The following pipe delimited messages are unrelated comments posted by a person. "
    "Determine the age and IQ of that person based on their writing. "
    "Your output should be formatted as json with the keys: age and iq. The mapped values should be integers."
)


def determine_redditor_details(redditor_content):
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    redditor_details = {"age": None, "iq": None}

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": REDDITOR_DETAILS_PROMPT,
                },
                {
                    "role": "user",
                    "content": redditor_content,
                },
            ],
            model=config.OPENAI_MODEL,
        )
        content = chat_completion.choices[0].message.content
    except openai.OpenAIError:
        log.exception(f"Error thrown processing chat: %s", redditor_content)
    else:
        try:
            json_str = content.replace("`", "").split("json", 1)[-1]
            json_dct = json.loads(json_str)
            redditor_details["age"] = int(json_dct["age"])
            redditor_details["iq"] = int(json_dct["iq"])
        except Exception:
            log.exception("Unhandled parsing error while parsing OpenAI response: %s", content)

    return redditor_details


def _filter_content(content: str) -> str:
    if not content or content == "[deleted]":
        return ""

    # Remove sentences containing URLs while preserving surrounding sentences.
    sentences = []
    for sentence in TOKENIZER.tokenize(content):
        include_sentence = True

        for fragment in sentence.split():
            if validators.url(fragment):
                include_sentence = False
                break

        if include_sentence:
            sentences.append(sentence)

    retval = " ".join(sentences)

    # Do not process short comments.
    if len(retval) < config.CONTENT_FILTER_MIN_LENGTH:
        retval = ""

    return retval


def process_redditor(username):
    client = praw.Reddit(**settings.REDDIT_API_SETTINGS)
    redditor: PrawRedditor = client.redditor(name=username)

    submissions = []

    # Get the body of threads submitted by the user.
    for thread in redditor.submissions.new():
        if text := _filter_content(thread.selftext):
            comment_tokens = "|".join(submissions + [text])
            if len(comment_tokens) < config.OPENAI_MODEL_MAX_TOKENS:
                # We do not want to fetch more comments than the openai model can handle.
                submissions.append(text)
            else:
                break

    # Get the body of comments submitted by the user.
    for comment in redditor.comments.new():
        if text := _filter_content(comment.body):
            comment_tokens = "|".join(submissions + [text])
            if len(comment_tokens) < config.OPENAI_MODEL_MAX_TOKENS:
                # We do not want to fetch more comments than the openai model can handle.
                submissions.append(text)
            else:
                break

    unprocessable_reason = ""
    if submissions:
        if len(submissions) >= config.REDDITOR_MIN_SUBMISSIONS:
            content = "|".join(submissions)
            details = determine_redditor_details(content)
            if all(details.values()):
                Redditor.objects.update_or_create(
                    username=username,
                    defaults={
                        "age": details["age"],
                        "iq": details["iq"],
                        "last_processed": timezone.now(),
                    },
                    create_defaults={
                        "age": details["age"],
                        "iq": details["iq"],
                        "last_processed": timezone.now(),
                        "username": username,
                    },
                )
            else:
                unprocessable_reason = f"Details missing from openai response: {details}"
        else:
            unprocessable_reason = f"Less than {config.REDDITOR_MIN_SUBMISSIONS} submissions  available for processing"
    else:
        unprocessable_reason = "No submissions available for processing"

    if unprocessable_reason:
        UnprocessableRedditor.objects.update_or_create(
            username=username,
            defaults={
                "reason": unprocessable_reason,
            },
            create_defaults={
                "reason": unprocessable_reason,
                "username": username,
            },
        )


def process_thread(url):
    client = praw.Reddit(**settings.REDDIT_API_SETTINGS)
    submission: Submission = client.submission(url=url)
    submission.comments.replace_more(limit=None)

    polarity_values = []
    for comment in submission.comments.list():
        if comment.author:
            if body := _filter_content(comment.body):
                blob = textblob.TextBlob(body)
                polarity_values.append(blob.sentiment.polarity)

                if len(polarity_values) == config.THREAD_MAX_COMMENTS_PROCESSED:
                    break

    if polarity_values and len(polarity_values) >= config.THREAD_MIN_COMMENTS_PROCESSED:
        sentiment_polarity = statistics.mean(polarity_values)
        Thread.objects.update_or_create(
            url=url,
            defaults={
                "last_processed": timezone.now(),
                "sentiment_polarity": sentiment_polarity,
            },
            create_defaults={
                "last_processed": timezone.now(),
                "sentiment_polarity": sentiment_polarity,
                "url": url,
            },
        )
    else:
        reason = f"Less than {config.THREAD_MIN_COMMENTS_PROCESSED} comments available for processing"
        UnprocessableThread.objects.update_or_create(
            url=url,
            defaults={
                "reason": reason,
            },
            create_defaults={
                "reason": reason,
                "url": url,
            },
        )
