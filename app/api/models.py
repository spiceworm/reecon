from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    types,
)
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import expression


ModelBase = declarative_base()


class utcnow(expression.FunctionElement):
    type = types.DateTime()
    inherit_cache = True


@compiles(utcnow, "postgresql")
def pg_utcnow(element, compiler, **kw):
    return "TIMEZONE('utc', CURRENT_TIMESTAMP)"


class ThreadModel(ModelBase):
    __tablename__ = "thread"

    id = Column(Integer, primary_key=True)
    last_checked = Column(
        DateTime(timezone=True),
        onupdate=utcnow,
        default=utcnow,
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
    )
    iq = Column(
        String(64),
    )
    last_checked = Column(
        DateTime(timezone=True),
        onupdate=utcnow,
        default=utcnow,
    )
    name = Column(
        String(64),
        unique=True,
        nullable=False,
    )
