#!/usr/bin/env python
import asyncio

import click
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    async_scoped_session,
    create_async_engine,
)

from application.config import settings
from application.models import UserModel


@click.group()
@click.pass_context
def cli(ctx):
    pass


@cli.command()
@click.option("--username", prompt=True)
@click.option("--email", prompt=True)
@click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
def add_user(username, email, password):
    async def _add_user():
        db_engine = create_async_engine(settings.db_connection_string, echo=True)
        db_session = async_scoped_session(
            async_sessionmaker(db_engine, expire_on_commit=False),
            scopefunc=asyncio.current_task,
        )

        async with db_session() as session:
            values = [{"username": username, "email": email, "password": password}]
            q = sa.insert(UserModel)
            await session.execute(q, values)
            await session.commit()
            await db_engine.dispose()

    asyncio.run(_add_user())


if __name__ == "__main__":
    cli()
