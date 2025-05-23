import json
import logging
from typing import List

from langchain.chat_models import init_chat_model
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
)
from langchain_core.messages.utils import count_tokens_approximately

import pydantic
import pydantic.json
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_result,
    stop_after_attempt,
    wait_random_exponential,
)

from .. import schemas


log = logging.getLogger("reecon.services.llm_provider")


__all__ = ("LlmProvider",)


def is_missing_expected_generated_data(raw_response: schemas.LlmProviderRawResponse):
    return not all(raw_response.parsed.model_dump().values())


class LlmProvider:
    def __init__(self, *, api_key: str, llm_name: str, llm_provider_name: str):
        self.api_key = api_key
        self.llm_name = llm_name
        self.llm_provider_name = llm_provider_name

    @staticmethod
    def estimate_tokens(inputs: List[schemas.LlmInput]) -> int:
        """
        Estimate the number of tokens in a string using a simple heuristic. Use this when an exact count is not necessary.
        This is a very rough estimate and should not be used for precise token counting.

        Args:
            inputs (List[schemas.LlmInput]): The inputs to count the number of tokens for.

        Returns:
            int: The estimated number of tokens.
        """
        input_str = json.dumps(inputs, default=pydantic.json.pydantic_encoder)
        return count_tokens_approximately([input_str])

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=retry_if_result(is_missing_expected_generated_data),
        stop=stop_after_attempt(3),
        wait=wait_random_exponential(min=1, max=60),
    )
    def generate_data(self, *, inputs: List[schemas.LlmInput], prompt: str, response_format: type[pydantic.BaseModel]) -> schemas.LlmProviderRawResponse:  # pragma: no cover
        """
        Generate data using the LLM provider.

        Args:
            inputs (List[schemas.LlmInput]): The inputs to be processed by the LLM.
            prompt (str): The prompt to be used for generation.
            response_format (type[pydantic.BaseModel]): The expected response format.

        Returns:
            pydantic.BaseModel: The generated data.
        """
        model = init_chat_model(self.llm_name, api_key=self.api_key, model_provider=self.llm_provider_name)
        runnable = model.with_structured_output(response_format, include_raw=True)
        input_str = json.dumps(inputs, default=pydantic.json.pydantic_encoder)
        output = runnable.invoke(
            [
                SystemMessage(prompt),
                HumanMessage(input_str),
            ]
        )
        return schemas.LlmProviderRawResponse(**output)
