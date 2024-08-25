from datetime import (
    datetime,
    timezone,
)
import json
import logging
import statistics
from typing import List

from asyncpgsa import pg
import asyncpraw
from asyncpraw.models import (
    MoreComments,
    Submission,
    Redditor,
)
import asyncprawcore
from httpx import AsyncClient
import nltk.data
import openai
from sqlalchemy.dialects.postgresql import insert
import textblob
import validators

from .config import settings
from .models import (
    ThreadModel,
    UserModel,
)


logging.basicConfig(
    datefmt="%H:%M:%S",
    format="%(asctime)s,%(msecs)d %(name)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(settings.log_dir / "api.log"),
    ],
)
log = logging.getLogger(__name__)
log.setLevel(settings.log_level)

TOKENIZER = nltk.data.load('tokenizers/punkt/english.pickle')

USER_DETAILS_PROMPT = (
    "The following pipe delimited messages are unrelated comments posted by a person. "
    "Determine the age and IQ of that person based on their writing. "
    "Your output should be formatted as json with the keys: age and iq. The mapped values should be integers."
)


def _comment_should_be_processed(s: str) -> bool:
    # Do not process short comments.
    if len(s) < settings.comment_filter_settings["min_length"]:
        return False

    if settings.comment_filter_settings["exclude_urls"]:
        # Do not process comments that contain any URLs.
        for sentence in TOKENIZER.tokenize(s):
            for fragment in sentence.split():
                if validators.url(fragment):
                    return False

    return True


def _determine_user_details(openai_client: openai.Client, comments: List[str]) -> dict:
    chat_completion = openai_client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": USER_DETAILS_PROMPT,
            },
            {
                "role": "user",
                "content": "|".join(comments),
            },
        ],
        model=settings.openai_settings["model"],
    )
    content = chat_completion.choices[0].message.content
    retval = {"age": None, "iq": None}

    try:
        json_str = content.replace("`", "").split("json", 1)[-1]
        json_dct = json.loads(json_str)
        retval["age"] = int(json_dct["age"])
        retval["iq"] = int(json_dct["iq"])
    except Exception:
        log.info(f"Unprocessable OpenAI response: %s", content)

    return retval


async def process_thread(ctx, thread_url) -> None:
    submission: Submission = await ctx["reddit_client"].submission(url=thread_url)

    polarity_values = []
    for comment in await submission.comments():
        if not isinstance(comment, MoreComments):
            if _comment_should_be_processed(comment.body):
                blob = textblob.TextBlob(comment.body)
                polarity_values.append(blob.sentiment.polarity)

    if polarity_values:
        sentiment_polarity = statistics.mean(polarity_values)
        params = [
            {
                "last_checked": datetime.now(timezone.utc),
                "sentiment_polarity": sentiment_polarity,
                "url": thread_url,
            }
        ]
        insert_q = (
            insert(ThreadModel)
            .values(params)
            .on_conflict_do_update(
                index_elements=["url"],
                set_=params[0],
            )
        )
        setattr(insert_q, "parameters", params)
        await pg.fetch(insert_q)
        return
    await ctx["redis"].lpush("unprocessable_threads", thread_url)


async def process_username(ctx, username) -> None:
    try:
        # Set `fetch=True` so the `NotFound` exception is thrown here if the user no longer
        # exists instead of later when comments are fetched.
        user: Redditor = await ctx["reddit_client"].redditor(name=username, fetch=True)
    except (asyncprawcore.exceptions.Forbidden, asyncprawcore.exceptions.NotFound):
        pass
    else:
        comment_strings = []
        async for comment in user.comments.top():
            if _comment_should_be_processed(comment.body):
                comment_tokens = "|".join(comment_strings + [comment.body])
                if len(comment_tokens) > settings.openai_settings["max_tokens"]:
                    # Do not fetch more comments than the openai model can handle.
                    break
                comment_strings.append(comment.body)

        if comment_strings:
            data = _determine_user_details(ctx["openai_client"], comment_strings)
            if all(data.values()):
                params = [
                    {
                        "age": data["age"],
                        "iq": data["iq"],
                        "last_checked": datetime.now(timezone.utc),
                        "name": username,
                    }
                ]
                insert_q = (
                    insert(UserModel)
                    .values(params)
                    .on_conflict_do_update(
                        index_elements=["name"],
                        set_=params[0],
                    )
                )
                setattr(insert_q, "parameters", params)
                await pg.fetch(insert_q)
                return
    await ctx["redis"].lpush("unprocessable_users", username)


async def startup(ctx) -> None:
    # `ctx["redis"] = ArqRedis<ConnectionPool>` is defined by default
    ctx["async_client"] = AsyncClient()
    ctx["openai_client"] = openai.OpenAI(api_key=settings.openai_settings["api_key"])
    ctx["reddit_client"] = asyncpraw.Reddit(**settings.reddit_api_settings)
    await pg.init(
        dsn=settings.db_connection_string,
        min_size=5,
        max_size=10,
    )


async def shutdown(ctx) -> None:
    await ctx["async_client"].aclose()
    await pg.pool.close()


class WorkerSettings:
    functions = [
        process_thread,
        process_username,
    ]
    job_timeout = 15
    keep_result = 0
    max_tries = 1
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = settings.redis_connection_settings
