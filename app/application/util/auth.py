from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Annotated

from fastapi import (
    Depends,
    HTTPException,
    Request,
    status,
)
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
import sqlalchemy as sa

from ..config import settings
from ..models import UserModel


__all__ = (
    "authenticate_user",
    "create_access_token",
    "get_current_active_user",
)


HASHING_ALGORITHM = "HS256"


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


async def authenticate_user(db_session, username: str, password: str) -> UserModel | None:
    async with db_session() as session:
        async with session.begin():
            q = sa.select(UserModel).filter_by(
                password=password,
                username=username,
                enabled=True,
            )
            results = await session.execute(q)
            return results.scalars().one_or_none()


def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=HASHING_ALGORITHM)
    return encoded_jwt


async def _get_user(db_session, username: str) -> UserModel | None:
    async with db_session() as session:
        async with session.begin():
            q = sa.select(UserModel).filter_by(username=username)
            results = await session.execute(q)
            return results.scalars().one_or_none()


async def _get_current_user(token: Annotated[str, Depends(oauth2_scheme)], request: Request):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[HASHING_ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    else:
        user = await _get_user(request.app.db_session, username)
        if user is None:
            raise credentials_exception
        return user


async def get_current_active_user(current_user: Annotated[UserModel, Depends(_get_current_user)]):
    if not current_user.enabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
