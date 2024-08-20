from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base


ModelBase = declarative_base()


class ThreadModel(ModelBase):
    __tablename__ = "thread"

    id = Column(Integer, primary_key=True)

    # We cannot use `onupdate` to update this value for upserts.
    # https://github.com/sqlalchemy/sqlalchemy/discussions/5903
    last_checked = Column(
        DateTime(timezone=True),
        nullable=False,
    )
    sentiment_polarity = Column(
        Numeric(),
        nullable=False,
    )
    url = Column(
        Text(),
        unique=True,
        nullable=False,
    )


class UserModel(ModelBase):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    age = Column(
        String(64),
        nullable=False,
    )
    iq = Column(
        String(64),
        nullable=False,
    )
    # We cannot use `onupdate` to update this value for UPSERTs.
    # https://github.com/sqlalchemy/sqlalchemy/discussions/5903
    last_checked = Column(
        DateTime(timezone=True),
        nullable=False,
    )
    name = Column(
        String(64),
        unique=True,
        nullable=False,
    )
