import abc
import logging
from typing import List

import openai
import pydantic
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_result,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)
import tiktoken


log = logging.getLogger("reecon.services.llm_provider")


__all__ = ("cls_from_name",)


def cls_from_name(llm_provider_name: str):
    match llm_provider_name:
        case "openai":
            return OpenAiProvider
        case _:
            raise NotImplementedError(f"LLM provider {llm_provider_name} is not implemented.")


def is_missing_expected_generated_data(generated_data: pydantic.BaseModel):
    return not all(generated_data.model_dump().values())


class LlmProviderBase(abc.ABC):
    def __init__(self, *, api_key: str):
        self.api_key = api_key
        self._client = None

    @property
    @abc.abstractmethod
    def client(self):
        """
        The client for the LLM provider. This should be implemented in subclasses.
        """
        pass

    @abc.abstractmethod
    def count_tokens(self, s: str, llm_name: str) -> int:
        """
        Count the number of tokens in the given string using the encoding for the specified LLM.

        Args:
            s (str): The string to count tokens in.
            llm_name (str): The name of the LLM to use.

        Returns:
            int: The number of tokens in the string.
        """
        pass

    @abc.abstractmethod
    def generate_data(self, *, inputs: List[str], llm_name: str, prompt: str, response_format: type[pydantic.BaseModel]) -> pydantic.BaseModel:
        """
        Generate data using the LLM provider.

        Args:
            inputs (List[str]): The inputs to be processed by the LLM.
            llm_name (str): The name of the LLM to use.
            prompt (str): The prompt to be used for generation.
            response_format (type[pydantic.BaseModel]): The expected response format.

        Returns:
            pydantic.BaseModel: The generated data.
        """
        pass


class OpenAiProvider(LlmProviderBase):
    def __init__(self, *, api_key: str):
        super().__init__(api_key=api_key)

    @property
    def client(self):
        if self._client is None:
            self._client = openai.OpenAI(api_key=self.api_key)
        return self._client

    def count_tokens(self, s: str, llm_name: str) -> int:
        encoding = tiktoken.encoding_for_model(llm_name)
        return len(encoding.encode(s, disallowed_special=()))

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=(retry_if_result(is_missing_expected_generated_data) | retry_if_exception_type(openai.OpenAIError)),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def generate_data(self, *, inputs: List[str], llm_name: str, prompt: str, response_format: type[pydantic.BaseModel]) -> pydantic.BaseModel:
        chat_completion = self.client.beta.chat.completions.parse(
            messages=[
                {
                    "role": "system",
                    "content": prompt,
                },
                {
                    "role": "user",
                    "content": "|".join(inputs),
                },
            ],
            model=llm_name,
            response_format=response_format,
        )
        return chat_completion.choices[0].message.parsed
