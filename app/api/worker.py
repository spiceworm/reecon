import logging
from typing import List

from asyncpgsa import pg
from bs4 import BeautifulSoup
from httpx import AsyncClient
import openai
from sqlalchemy.dialects.postgresql import insert

from .config import settings
from .models import User


logging.basicConfig(
    datefmt="%H:%M:%S",
    format="%(asctime)s,%(msecs)d %(name)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(settings.log_dir / "api.log"),
    ],
)
log = logging.getLogger(__name__)
log.setLevel(settings.log_level)


def extract_comments(html) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    comments = []
    for div in soup.find_all("div", class_="usertext-body"):
        comment = div.find_next("p").get_text()
        comments.append(comment)
    return comments


def process_comments(openai_client, comments) -> dict:
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
        model=settings.openai_model,
    )
    age = None
    iq = None
    for line in chat_completion.choices[0].message.content.splitlines():
        try:
            k, v = line.split(":")
        except ValueError:
            log.info(f"Unprocessable response: %s", line)
        else:
            v = v.strip()
            if k == "IQ":
                iq = v
            elif k == "Age":
                age = v
            else:
                log.info(f"Unprocessable response: %s", line)
    return {"age": age, "iq": iq}


async def process_username(ctx, user_name) -> None:
    session: AsyncClient = ctx["session"]
    url = f"https://old.reddit.com/user/{user_name}/comments/"
    response = await session.get(url)
    if comments := extract_comments(response.text):
        data = process_comments(ctx["openai_client"], comments)
        if all(data.values()):
            params = [{"name": user_name, **data}]
            insert_q = (
                insert(User)
                .values(params)
                .on_conflict_do_update(
                    index_elements=["name"],
                    set_=data,
                )
            )
            setattr(insert_q, "parameters", params)
            await pg.fetch(insert_q)


async def startup(ctx) -> None:
    ctx["openai_client"] = openai.OpenAI(api_key=settings.openai_api_key)
    ctx["session"] = AsyncClient()
    await pg.init(
        dsn=settings.db_connection_string,
        min_size=5,
        max_size=10,
    )


async def shutdown(ctx) -> None:
    await ctx["session"].aclose()
    await pg.pool.close()


class WorkerSettings:
    functions = [process_username]
    job_timeout = 10
    keep_result = 0
    log_results = False
    max_tries = 1
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = settings.redis_connection_settings
