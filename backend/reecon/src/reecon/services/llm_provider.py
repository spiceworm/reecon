import logging
from typing import List

from langchain.chat_models import init_chat_model
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
)
from langchain_core.messages.utils import count_tokens_approximately

import pydantic
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_result,
    stop_after_attempt,
    wait_random_exponential,
)

from ..types import LlmProviderRawResponse


log = logging.getLogger("reecon.services.llm_provider")


__all__ = ("LlmProvider",)


def is_missing_expected_generated_data(raw_response: LlmProviderRawResponse):
    return not all(raw_response["parsed"].model_dump().values())


class LlmProvider:
    def __init__(self, *, api_key: str, llm_name: str, llm_provider_name: str):
        self.api_key = api_key
        self.llm_name = llm_name
        self.llm_provider_name = llm_provider_name
        self._llm_client = None

    def count_tokens(self, s: str, llm_name: str) -> int:
        """
        Count the number of tokens in the given string using the encoding for the specified LLM.

        Args:
            s (str): The string to count tokens in.
            llm_name (str): The name of the LLM to use.

        Returns:
            int: The number of tokens in the string.
        """
        raise NotImplementedError("Exact token counting is not implemented yet.")

    @staticmethod
    def estimate_tokens(s: str) -> int:
        """
        Estimate the number of tokens in a string using a simple heuristic. Use this when an exact count is not necessary.
        This is a very rough estimate and should not be used for precise token counting.

        Args:
            s (str): The string to estimate tokens for.

        Returns:
            int: The estimated number of tokens.
        """
        return count_tokens_approximately([s])

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_result(is_missing_expected_generated_data),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def generate_data(self, *, inputs: List[str], prompt: str, response_format: type[pydantic.BaseModel]) -> LlmProviderRawResponse:
        """
        Generate data using the LLM provider.

        Args:
            inputs (List[str]): The inputs to be processed by the LLM.
            prompt (str): The prompt to be used for generation.
            response_format (type[pydantic.BaseModel]): The expected response format.

        Returns:
            pydantic.BaseModel: The generated data.
        """
        structured_chat_model = self.llm_client.with_structured_output(response_format, include_raw=True)
        return structured_chat_model.invoke(
            [
                SystemMessage(prompt),
                HumanMessage("|".join(inputs)),
            ]
        )

    @property
    def llm_client(self):
        """
        Lazy load the LLM client.

        Returns:
            The LLM client.
        """
        if self._llm_client is None:
            self._llm_client = init_chat_model(
                self.llm_name,
                api_key=self.api_key,
                model_provider=self.llm_provider_name,
            )
        return self._llm_client
