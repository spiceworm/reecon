import abc
import logging
import statistics
from typing import List

from django.conf import settings
import pydantic
import textblob


log = logging.getLogger("app.services.producer")


__all__ = (
    "LlmProducerService",
    "NlpProducerService",
)


class ProducerService(abc.ABC):
    @property
    @abc.abstractmethod
    def generate_data(self, *args, **kwargs):
        pass


class LlmProducerService(ProducerService):
    def __init__(self, response_format: type[pydantic.BaseModel]):
        self.response_format = response_format

    def generate_data(self, *, inputs: List[str], llm_name: str, prompt: str) -> pydantic.BaseModel:
        chat_completion = settings.OPENAI_API.beta.chat.completions.parse(
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
        # # Total tokens used for prompt and response
        # chat_completion.usage.total_tokens
        return chat_completion.choices[0].message.parsed


class NlpProducerService(ProducerService):
    def __init__(self, response_format: type[pydantic.BaseModel]):
        self.response_format = response_format

    def generate_data(self, *, inputs: List[str], nlp_name: str) -> pydantic.BaseModel:
        if nlp_name == "textblob":
            polarity_values = []
            for text in inputs:
                blob = textblob.TextBlob(text)
                polarity_values.append(blob.sentiment.polarity)
            sentiment_polarity = statistics.mean(polarity_values)
            return self.response_format.model_validate({"sentiment_polarity": sentiment_polarity})
        raise NotImplementedError(f"NLP using {nlp_name} is not implemented")
