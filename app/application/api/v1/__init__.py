from fastapi import APIRouter


api_router = APIRouter()
reddit_router = APIRouter(prefix="/reddit", tags=["reddit"])


from .base import *
from .reddit import *


api_router.include_router(reddit_router)
