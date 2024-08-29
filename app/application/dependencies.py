from typing import Annotated

from fastapi import Security

from .models import UserModel
from .util.auth import get_current_active_user


__all__ = ("AuthUser",)


AuthUser = Annotated[UserModel, Security(get_current_active_user)]
