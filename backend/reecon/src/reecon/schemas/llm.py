import datetime as dt
from typing import Optional

from langchain_core.messages import AIMessage
from langchain_core.messages.ai import UsageMetadata
from pydantic import (
    BaseModel,
    ConfigDict,
)


__all__ = (
    "CommentSubmission",
    "ThreadSubmission",
    "LlmInput",
    "LlmProviderRawResponse",
    "LlmProviderSettings",
    "LlmProvidersSettings",
    "LlmResponse",
)


class CommentSubmission(BaseModel):
    author: str
    context: str
    downvotes: int
    subreddit: str
    text: str
    timestamp: dt.datetime
    upvotes: int


class ThreadSubmission(BaseModel):
    author: str
    downvotes: int
    subreddit: str
    text: str
    timestamp: dt.datetime
    upvotes: int


LlmInput = CommentSubmission | ThreadSubmission


class LlmProviderRawResponse(BaseModel):
    parsed: BaseModel
    parsing_error: Optional[str] = ""
    raw: AIMessage


class LlmProviderSettings(BaseModel):
    api_key: str


class LlmProvidersSettings(BaseModel):
    openai: LlmProviderSettings


class LlmResponse(BaseModel):
    # If extra fields are included when creating the model, they will be ignored. This occurs when calling `model_validate.(**kwargs)`
    # if kwargs contains extra fields that are not defined in the model.
    model_config = ConfigDict(extra="forbid")

    usage_metadata: UsageMetadata
