from datetime import (
    datetime,
    timedelta,
    timezone,
)
import logging
from typing import List

from arq import create_pool
from asyncpgsa import pg
import sqlalchemy

from . import router
from ..config import settings
from ..models import User


__all__ = (
    "_status",
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


@router.post("/users")
async def _users(user_names: List[str]) -> dict:
    """
    Returns a response code of 200.
    """
    select_q = User.__table__.select().where(User.name.like(sqlalchemy.any_(user_names)))

    # Gather a list of usernames that were processed < 1 day ago
    fresh_user_entries = set()
    now = datetime.now(timezone.utc)
    for row in await pg.fetch(select_q, user_names):
        if row["last_checked"] + timedelta(days=1) > now:
            fresh_user_entries.add(row["name"])

    redis = await create_pool(settings.redis_connection_settings)
    for user_name in user_names:
        # Do not submit usernames for processing if they were processed recently.
        if user_name not in fresh_user_entries:
            log.debug("Enqueuing %s", user_name)
            await redis.enqueue_job("process_username", user_name, _job_id=user_name)
        else:
            log.debug("Ignoring %s", user_name)

    return {row["name"]: {"age": row["age"], "iq": row["iq"]} for row in await pg.fetch(select_q, user_names)}
