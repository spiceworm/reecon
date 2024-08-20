from datetime import (
    datetime,
    timezone,
)
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
import openai
from sqlalchemy.dialects.postgresql import insert
import textblob

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


def _determine_user_details(openai_client: openai.Client, comments: List[str]) -> dict:
    chat_completion = openai_client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "The provided pipe delimited messages are unrelated comments posted by a person. Determine the age and IQ of the author based on their writing. Your answer should only consist of a numeric age and IQ value.",
            },
            {
                "role": "user",
                "content": "|".join(comments),
            },
        ],
        model=settings.openai_settings["model"],
    )
    age = None
    iq = None
    for line in chat_completion.choices[0].message.content.splitlines():
        try:
            # TODO: Extract values from response better using regex or something
            k, v = line.split(":")
        except ValueError:
            log.info(f"Unprocessable OpenAI response: %s", line)
        else:
            v = v.strip()
            if v.isdigit():
                if k == "IQ":
                    iq = v
                    continue
                elif k == "Age":
                    age = v
                    continue
                log.info(f"Unprocessable OpenAI response: %s", line)
    return {"age": age, "iq": iq}


async def process_thread(ctx, thread_url) -> None:
    submission: Submission = await ctx["reddit_client"].submission(url=thread_url)

    polarity_values = []
    for comment in await submission.comments():
        if not isinstance(comment, MoreComments):
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
    except asyncprawcore.exceptions.NotFound:
        pass
    else:
        comment_strings = []
        async for comment in user.comments.top():
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
