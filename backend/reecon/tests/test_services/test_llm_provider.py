from langchain_core.messages import AIMessage
from pydantic import BaseModel
import pytest

from reecon.services import LlmProvider
from reecon.services.llm_provider import is_missing_expected_generated_data
from reecon.schemas import LlmProviderRawResponse


class MockParsedModel(BaseModel):
    field: str


def test_is_missing_expected_generated_data():
    """
    Test the is_missing_expected_generated_data function with a response that has all expected generated data.
    """
    parsed_model = MockParsedModel(field="test")
    ai_message = AIMessage(content="test message")
    response = LlmProviderRawResponse(parsed=parsed_model, parsing_error=None, raw=ai_message)
    assert not is_missing_expected_generated_data(response)


def test_is_missing_expected_generated_data_with_missing_data():
    """
    Test the is_missing_expected_generated_data function with a response that has missing expected generated data.
    """
    parsed_model = MockParsedModel(field="")
    ai_message = AIMessage(content="test message")
    response = LlmProviderRawResponse(parsed=parsed_model, parsing_error=None, raw=ai_message)
    assert is_missing_expected_generated_data(response)


class TestLlmProvider:
    @pytest.fixture
    def llm_provider(self):
        return LlmProvider(api_key="test_api_key", llm_name="test_llm_name", llm_provider_name="test_llm_provider_name")

    def test_estimate_tokens(self, llm_provider):
        """
        Test the estimate_tokens method of the LlmProvider class.
        """
        result = llm_provider.estimate_tokens("this is a string")
        assert isinstance(result, int)

    def test_generate_data(self):
        """
        This is untested because it is just wrapping langchain functionality.
        """

    def test_llm_client(self):
        """
        This is untested because it is just wrapping langchain functionality.
        """
