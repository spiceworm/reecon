from pydantic import BaseModel
from langchain_core.messages import AIMessage

from reecon import types


class MockParsedModel(BaseModel):
    field: str


def test_llm_provider_raw_response():
    parsed_model = MockParsedModel(field="test")
    ai_message = AIMessage(content="test message")
    llm_provider_raw_response = types.LlmProviderRawResponse(parsed=parsed_model, parsing_error=None, raw=ai_message)
    assert llm_provider_raw_response["parsed"] is parsed_model
    assert llm_provider_raw_response["parsing_error"] is None
    assert llm_provider_raw_response["raw"] is ai_message


def test_llm_provider_settings():
    llm_provider_settings = types.LlmProviderSettings(api_key="test_api_key")
    assert llm_provider_settings["api_key"] == "test_api_key"


def test_llm_providers_settings():
    llm_provider_settings = types.LlmProviderSettings(api_key="test_api_key")
    settings = types.LlmProvidersSettings(openai=llm_provider_settings)
    assert settings["openai"]["api_key"] == "test_api_key"
