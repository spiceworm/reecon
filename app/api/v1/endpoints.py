from datetime import (
    datetime,
    timedelta,
    timezone,
)
import logging
from typing import List

from asyncpgsa import pg
from fastapi import Request
import sqlalchemy

from . import router
from ..config import settings
from ..models import (
    ThreadModel,
    UserModel,
)


__all__ = (
    "_status",
    "_threads",
    "_users",
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


@router.get("/status")
async def _status() -> dict:
    """
    Returns a response code of 200.
    """
    return {}


@router.post("/threads")
async def _threads(thread_urls: List[str], request: Request) -> dict:
    now = datetime.now(timezone.utc)
    select_q = ThreadModel.__table__.select().where(ThreadModel.url.like(sqlalchemy.any_(thread_urls)))
    select_fresh_entries_q = select_q.filter(ThreadModel.last_checked + timedelta(hours=24) > now).with_only_columns(
        ThreadModel.__table__.c.url
    )
    fresh_thread_urls = {row["url"] for row in await pg.fetch(select_fresh_entries_q, thread_urls)}
    unprocessable_threads = {url.decode() for url in await request.app.redis.lrange("unprocessable_threads", 0, -1)}

    # Iterate over thread_urls, excluding those that are:
    # - in the db and not considered stale yet
    # - unprocessable for some reason (e.g. they have no comments)
    for thread_url in set(thread_urls).difference(fresh_thread_urls).difference(unprocessable_threads):
        log.debug("Enqueuing %s", thread_url)
        await request.app.redis.enqueue_job("process_thread", thread_url, _job_id=thread_url)

    return {row["url"]: row["sentiment_polarity"] for row in await pg.fetch(select_q, thread_urls)}


@router.post("/users")
async def _users(usernames: List[str], request: Request) -> dict:
    """
    - Enqueues jobs to process each username if it is not in the database or was last checked < 1 day ago.
    - Processing entails retrieving a portion of the user's comment history and, using OpenAI, determines
      the age and IQ of the user.
    - Entries in the db matching `usernames` are returned with the determined age and IQ values.
    """
    now = datetime.now(timezone.utc)
    select_q = UserModel.__table__.select().where(UserModel.name.like(sqlalchemy.any_(usernames)))
    select_fresh_entries_q = select_q.filter(UserModel.last_checked + timedelta(hours=24) > now).with_only_columns(
        UserModel.__table__.c.name
    )
    fresh_usernames = {row["name"] for row in await pg.fetch(select_fresh_entries_q, usernames)}
    unprocessable_usernames = {s.decode() for s in await request.app.redis.lrange("unprocessable_users", 0, -1)}

    # Iterate over usernames, excluding those that are:
    # - in the db and not considered stale yet
    # - unprocessable for some reason (e.g. they have no comments, openai gives bad output each time)
    for username in set(usernames).difference(fresh_usernames).difference(unprocessable_usernames):
        log.debug("Enqueuing %s", username)
        await request.app.redis.enqueue_job("process_username", username, _job_id=username)

    retval = {}

    for row in await pg.fetch(select_q, usernames):
        retval[row["name"]] = {"age": row["age"], "iq": row["iq"]}

    for username in unprocessable_usernames:
        retval[username] = {"error": "UNPROCESSABLE"}

    return retval
