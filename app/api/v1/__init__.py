from fastapi import APIRouter


base_router = APIRouter()
reddit_router = APIRouter(prefix="/reddit", tags=["reddit"])


from .base import *
from .reddit import *


base_router.include_router(reddit_router)
