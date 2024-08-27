from fastapi import APIRouter


endpoint_router = APIRouter()
auth_router = APIRouter(prefix="/auth", tags=["auth"])


from .auth import *


endpoint_router.include_router(auth_router)
