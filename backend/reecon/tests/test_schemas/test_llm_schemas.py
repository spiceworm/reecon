from pydantic import BaseModel

from reecon.schemas import llm


class MockParsedModel(BaseModel):
    field: str


class TestLlmResponse:
    def test_create(self, usage_metadata):
        llm_response = llm.LlmResponse(usage_metadata=usage_metadata)
        assert llm_response.usage_metadata == usage_metadata


class TestLlmProviderRawResponse:
    def test_create(self, ai_message):
        parsed_model = MockParsedModel(field="test")
        raw_response = ai_message()
        llm_provider_raw_response = llm.LlmProviderRawResponse(parsed=parsed_model, raw=raw_response)
        assert llm_provider_raw_response.parsed is parsed_model
        assert llm_provider_raw_response.raw is raw_response
        assert not llm_provider_raw_response.parsing_error


class TestLlmProviderSettings:
    def test_create(self):
        llm_provider_settings = llm.LlmProviderSettings(api_key="test_api_key")
        assert llm_provider_settings.api_key == "test_api_key"


class TestLlmProvidersSettings:
    def test_create(self):
        llm_provider_settings = llm.LlmProviderSettings(api_key="test_api_key")
        settings = llm.LlmProvidersSettings(openai=llm_provider_settings)
        assert settings.openai.api_key == "test_api_key"
