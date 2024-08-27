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
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm,
)
import jwt
from jwt.exceptions import InvalidTokenError
import pydantic
import sqlalchemy as sa

from . import endpoint_router
from ..config import settings
from ..models import UserModel


HASHING_ALGORITHM = "HS256"


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


class Token(pydantic.BaseModel):
    access_token: str
    token_type: str


async def get_user(db_session, username: str) -> UserModel | None:
    async with db_session() as session:
        async with session.begin():
            q = sa.select(UserModel).filter_by(username=username)
            results = await session.execute(q)
            return results.scalars().one_or_none()


async def authenticate_user(db_session, username: str, password: str) -> UserModel | None:
    async with db_session() as session:
        async with session.begin():
            q = sa.select(UserModel).filter_by(
                password=password,
                username=username,
            )
            results = await session.execute(q)
            return results.scalars().one_or_none()


def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=HASHING_ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], request: Request):
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
        user = await get_user(request.app.db_session, username)
        if user is None:
            raise credentials_exception
        return user


async def get_current_active_user(current_user: Annotated[UserModel, Depends(get_current_user)]):
    if not current_user.enabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@endpoint_router.post("/auth/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], request: Request) -> Token:
    user = await authenticate_user(request.app.db_session, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=1))
    return Token(access_token=access_token, token_type="bearer")


@endpoint_router.get("/users/me")
async def read_users_me(current_user: Annotated[UserModel, Depends(get_current_active_user)]):
    return {
        "create_date": current_user.create_date,
        "email": current_user.email,
        "enabled": current_user.enabled,
        "username": current_user.username,
    }
