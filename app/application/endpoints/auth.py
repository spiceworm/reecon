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

from . import auth_router
from ..models import UserModel
from ..util.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
)


class Token(pydantic.BaseModel):
    access_token: str
    token_type: str


@auth_router.post("/token")
async def auth_token_create(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], request: Request) -> Token:
    user = await authenticate_user(request.app.db_session, form_data.username, form_data.password)
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
async def auth_token_lookup(current_user: Annotated[UserModel, Depends(get_current_active_user)]):
    return {
        "create_date": current_user.create_date,
        "email": current_user.email,
        "enabled": current_user.enabled,
        "username": current_user.username,
    }
