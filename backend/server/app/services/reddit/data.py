import abc
import logging
from typing import List

import nltk
import pydantic
import validators

from ..producer import (
    LlmProducerService,
    NlpProducerService,
)


__all__ = (
    "GeneratedData",
    "GeneratedRedditorData",
    "GeneratedThreadData",
    "RedditDataService",
)


log = logging.getLogger("app.services.reddit.data")


class GeneratedRedditorData(pydantic.BaseModel):
    age: int | None = None
    iq: int | None = None
    sentiment_polarity: float | None = None
    summary: str | None = None


class GeneratedThreadData(pydantic.BaseModel):
    sentiment_polarity: float | None = None
    summary: str | None = None


GeneratedData = GeneratedRedditorData | GeneratedThreadData


class RedditDataService(abc.ABC):
    TOKENIZER = nltk.data.load("tokenizers/punkt/english.pickle")

    def __init__(self):
        self.llm = LlmProducerService(response_format=self.response_format)
        self.nlp = NlpProducerService(response_format=self.response_format)

    @abc.abstractmethod
    def create(self, *args, **kwargs):
        pass

    @abc.abstractmethod
    def create_object(self, *args, **kwargs):
        pass

    def generate_data(self, *, inputs: List[str], llm_name: str, nlp_name: str, prompt: str) -> GeneratedData:
        """
        See docstring in child class methods.
        """
        nlp_data = self.nlp.generate_data(inputs=inputs, nlp_name=nlp_name)
        llm_data = self.llm.generate_data(inputs=inputs, llm_name=llm_name, prompt=prompt)
        return self.response_format.model_validate({**nlp_data.model_dump(), **llm_data.model_dump()})

    @abc.abstractmethod
    def get_submissions(self, *args, **kwargs):
        pass

    def filter_submission(self, *, min_characters: int, text: str) -> str:
        if not text or text == "[deleted]":
            return ""

        # Remove sentences containing URLs while preserving surrounding sentences.
        sentences = []
        for sentence in self.TOKENIZER.tokenize(text):
            include_sentence = True

            for fragment in sentence.split():
                if validators.url(fragment):
                    include_sentence = False
                    break

            if include_sentence:
                sentences.append(sentence)

        retval = " ".join(sentences)

        # Do not process short comments.
        if len(retval) < min_characters:
            retval = ""

        return retval

    @property
    @abc.abstractmethod
    def response_format(self):
        pass
