from typing import TypedDict

from langchain_core.messages import AIMessage
import pydantic


__all__ = (
    "LlmProviderRawResponse",
    "LlmProvidersSettings",
)


class LlmProviderRawResponse(TypedDict):
    parsed: pydantic.BaseModel
    parsing_error: str | None
    raw: AIMessage


class LlmProviderSettings(TypedDict):
    api_key: str


class LlmProvidersSettings(TypedDict):
    openai: LlmProviderSettings
