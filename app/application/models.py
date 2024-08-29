from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
)
from sqlalchemy_utils import (
    StringEncryptedType,
    URLType,
)

from .config import settings


__all__ = (
    "Base",
    "RedditorModel",
    "ThreadModel",
    "UserModel",
)


class Base(AsyncAttrs, DeclarativeBase):
    pass


class RedditorModel(Base):
    __tablename__ = "redditor"

    id: Mapped[int] = mapped_column(
        nullable=False,
        primary_key=True,
    )
    age: Mapped[int] = mapped_column(
        sa.Integer(),
        nullable=False,
    )
    iq: Mapped[int] = mapped_column(
        sa.Integer(),
        nullable=False,
    )
    # We cannot use `onupdate` to update this value for UPSERTs.
    # https://github.com/sqlalchemy/sqlalchemy/discussions/5903
    last_checked: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        sa.String(64),
        nullable=False,
        unique=True,
    )


class ThreadModel(Base):
    __tablename__ = "thread"

    id: Mapped[int] = mapped_column(
        nullable=False,
        primary_key=True,
    )

    # We cannot use `onupdate` to update this value for upserts.
    # https://github.com/sqlalchemy/sqlalchemy/discussions/5903
    last_checked: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
    )
    sentiment_polarity: Mapped[float] = mapped_column(
        sa.Float(),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(
        URLType(),
        nullable=False,
        unique=True,
    )


class UserModel(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(
        nullable=False,
        primary_key=True,
    )
    create_date: Mapped[datetime] = mapped_column(
        server_default=sa.func.now(),
    )
    email: Mapped[str] = mapped_column(
        StringEncryptedType(
            key=settings.secret_key,
            padding="pkcs5",
        ),
        nullable=False,
        unique=True,
    )
    enabled: Mapped[bool] = mapped_column(
        sa.Boolean(),
        default=True,
        nullable=False,
    )
    password: Mapped[str] = mapped_column(
        StringEncryptedType(
            key=settings.secret_key,
            padding="pkcs5",
        ),
        nullable=False,
    )
    username: Mapped[str] = mapped_column(
        sa.String(64),
        nullable=False,
        unique=True,
    )
