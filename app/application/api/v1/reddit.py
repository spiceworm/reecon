from datetime import (
    datetime,
    timedelta,
    timezone,
)
import logging
from typing import List

from fastapi import Request
import pydantic
import sqlalchemy as sa

from . import reddit_router
from ...config import settings
from ...dependencies import AuthUser
from ...models import (
    RedditorModel,
    ThreadModel,
)


__all__ = (
    "put_reddit_threads",
    "post_reddit_threads",
    "put_reddit_users",
    "post_reddit_users",
)


logging.basicConfig(
    datefmt="%H:%M:%S",
    format="%(asctime)s,%(msecs)d %(name)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(settings.log_dir / "api.log"),
    ],
)
log = logging.getLogger(__file__)
log.setLevel(settings.log_level)


class User(pydantic.BaseModel):
    email: str
    enabled: bool
    username: str


class ThreadEndpointParams(pydantic.BaseModel):
    thread_urls: List[str]


class UserEndpointParams(pydantic.BaseModel):
    usernames: List[str]


@reddit_router.put("/threads", summary="Lookup processed thread URLs")
async def put_reddit_threads(args: ThreadEndpointParams, request: Request, user: AuthUser) -> dict:
    async with request.app.db_session() as session:
        q = sa.select(ThreadModel).where(ThreadModel.url.like(sa.any_(args.thread_urls)))
        results = await session.execute(q)
        return {thread.url: thread.sentiment_polarity for thread in results.scalars().all()}


@reddit_router.post("/threads", summary="Submit thread URLs for processing")
async def post_reddit_threads(args: ThreadEndpointParams, request: Request, user: AuthUser) -> None:
    async with request.app.db_session() as session:
        q = (
            sa.select(ThreadModel)
            .where(ThreadModel.url.like(sa.any_(args.thread_urls)))
            .filter(ThreadModel.last_checked + timedelta(hours=24) > datetime.now(timezone.utc))
        )
        results = await session.execute(q)
        fresh_thread_urls = {thread.url for thread in results.scalars().all()}

    unprocessable_threads = {url.decode() for url in await request.app.redis.lrange("unprocessable_threads", 0, -1)}

    # Iterate over thread_urls, excluding those that are:
    # - in the db and not considered stale yet
    # - unprocessable for some reason (e.g. they have no comments)
    for thread_url in set(args.thread_urls).difference(fresh_thread_urls).difference(unprocessable_threads):
        log.debug("Enqueuing %s", thread_url)
        await request.app.redis.enqueue_job("process_thread", thread_url, _job_id=thread_url)


@reddit_router.put("/users", summary="Lookup processed usernames")
async def put_reddit_users(args: UserEndpointParams, request: Request, user: AuthUser) -> dict:
    retval = {}

    async with request.app.db_session() as session:
        q = sa.select(RedditorModel).where(RedditorModel.name.like(sa.any_(args.usernames)))
        results = await session.execute(q)
        for redditor in results.scalars().all():
            retval[redditor.name] = {"age": redditor.age, "iq": redditor.iq}

    unprocessable_usernames = {s.decode() for s in await request.app.redis.lrange("unprocessable_users", 0, -1)}

    for username in unprocessable_usernames:
        retval[username] = {"error": "UNPROCESSABLE"}

    return retval


@reddit_router.post("/users", summary="Submit usernames for processing")
async def post_reddit_users(args: UserEndpointParams, request: Request, user: AuthUser) -> None:
    """
    - Enqueues jobs to process each username if it is not in the database or was last checked < 1 day ago.
    - Processing entails retrieving a portion of the user's comment history and, using OpenAI, determines
      the age and IQ of the user.
    """
    async with request.app.db_session() as session:
        q = (
            sa.select(RedditorModel)
            .where(RedditorModel.name.like(sa.any_(args.usernames)))
            .filter(RedditorModel.last_checked + timedelta(hours=24) > datetime.now(timezone.utc))
        )
        results = await session.execute(q)
        fresh_usernames = {redditor.url for redditor in results.scalars().all()}

    unprocessable_usernames = {s.decode() for s in await request.app.redis.lrange("unprocessable_users", 0, -1)}

    # Iterate over usernames, excluding those that are:
    # - in the db and not considered stale yet
    # - unprocessable for some reason (e.g. they have no comments, openai gives bad output each time)
    for username in set(args.usernames).difference(fresh_usernames).difference(unprocessable_usernames):
        log.debug("Enqueuing %s", username)
        await request.app.redis.enqueue_job("process_username", username, _job_id=username)
