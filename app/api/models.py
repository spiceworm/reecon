from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
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


class User(ModelBase):
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
        onupdate=utcnow(),
        server_default=utcnow(),
    )
    name = Column(
        String(64),
        unique=True,
        nullable=False,
    )
