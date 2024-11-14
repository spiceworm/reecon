import abc
import logging
import statistics
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
import textblob


log = logging.getLogger("reecon.services.producer")


__all__ = (
    "LlmProducerService",
    "NlpProducerService",
)


def is_missing_expected_generated_data(generated_data: pydantic.BaseModel):
    return not all(generated_data.model_dump().values())


class ProducerService(abc.ABC):
    @property
    @abc.abstractmethod
    def generate_data(self, *args, **kwargs):
        pass


class LlmProducerService(ProducerService):
    def __init__(self, response_format: type[pydantic.BaseModel]):
        self.response_format = response_format

    @retry(
        before_sleep=before_sleep_log(log, logging.DEBUG),
        reraise=True,
        retry=(retry_if_result(is_missing_expected_generated_data) | retry_if_exception_type(openai.OpenAIError)),
        stop=stop_after_attempt(10),
        wait=wait_random_exponential(min=1, max=60),
    )
    def generate_data(
        self, *, inputs: List[str], llm_name: str, producer_settings: dict, prompt: str
    ) -> pydantic.BaseModel:
        api_key = producer_settings["openai"]["api_key"]
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


class NlpProducerService(ProducerService):
    def __init__(self, response_format: type[pydantic.BaseModel]):
        self.response_format = response_format

    def generate_data(self, *, inputs: List[str], nlp_name: str) -> pydantic.BaseModel:
        # tenacity not being used here because only 1 value is being generated and it is being
        # generated in a predictable manner.
        if nlp_name == "textblob":
            polarity_values = []
            for text in inputs:
                blob = textblob.TextBlob(text)
                polarity_values.append(blob.sentiment.polarity)
            sentiment_polarity = statistics.mean(polarity_values)
            return self.response_format.model_validate({"sentiment_polarity": sentiment_polarity})
        raise NotImplementedError(f"NLP using {nlp_name} is not implemented")
