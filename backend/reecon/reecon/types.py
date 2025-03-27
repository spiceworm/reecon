from typing import TypedDict


__all__ = ("LlmProvidersSettings",)


class LlmProviderSettings(TypedDict):
    api_key: str


class LlmProvidersSettings(TypedDict):
    openai: LlmProviderSettings
