from datetime import timedelta
from typing import Annotated

from fastapi import (
    Depends,
    HTTPException,
    Request,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
import pydantic
import sqlalchemy as sa

from . import auth_router
from ..dependencies import AuthUser
from ..models import UserModel
from ..util.auth import (
    authenticate_user,
    create_access_token,
)


class SignupArgs(pydantic.BaseModel):
    username: str
    email: str
    password: str


class Token(pydantic.BaseModel):
    access_token: str
    token_type: str


@auth_router.post("/signup")
async def create_user(args: SignupArgs, request: Request) -> Token:
    # TODO: send verification email with link that activates user instead of returning token immediately
    values = [{"username": args.username, "email": args.email, "password": args.password}]
    q = sa.insert(UserModel)
    async with request.app.db_session() as session:
        await session.execute(q, values)
        await session.commit()
    access_token = create_access_token(data={"sub": args.username}, expires_delta=timedelta(days=30))
    return Token(access_token=access_token, token_type="bearer")


@auth_router.post("/token")
async def create_token(form: Annotated[OAuth2PasswordRequestForm, Depends()], request: Request) -> Token:
    """
    Validate username and password form data and retrieve the corresponding user. Create and return a
    JWT access token that can be used to authenticate as that user.
    """
    user = await authenticate_user(request.app.db_session, form.username, form.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Make tokens valid for 30 days. After 30 days they will have to reauthenticate with their
    # username and password in the browser extension to get a new token.
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(days=30))
    return Token(access_token=access_token, token_type="bearer")


@auth_router.get("/token")
async def authenticate_token(user: AuthUser):
    """
    Retrieve the user corresponding to the provided token. An HTTPException is raised if the token is expired,
    it is an invalid token, or the user corresponding to the token is disabled.
    """
    return {
        "create_date": user.create_date,
        "email": user.email,
        "enabled": user.enabled,
        "username": user.username,
    }
