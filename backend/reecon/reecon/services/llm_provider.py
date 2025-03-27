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

from .. import types


log = logging.getLogger("reecon.services.llm_provider")


__all__ = ("LlmProviderService",)


def is_missing_expected_generated_data(generated_data: pydantic.BaseModel):
    return not all(generated_data.model_dump().values())


class LlmProviderService:
    def __init__(self, response_format: type[pydantic.BaseModel]):
        self.response_format = response_format

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=(retry_if_result(is_missing_expected_generated_data) | retry_if_exception_type(openai.OpenAIError)),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def generate_data(self, *, inputs: List[str], llm_name: str, llm_provider_name: str, llm_providers_settings: types.LlmProvidersSettings, prompt: str) -> pydantic.BaseModel:
        api_key = llm_providers_settings["openai"]["api_key"]
        api = openai.OpenAI(api_key=api_key)
        chat_completion = api.beta.chat.completions.parse(
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
            response_format=self.response_format,
        )
        return chat_completion.choices[0].message.parsed
