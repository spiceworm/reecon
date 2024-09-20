import abc
import logging
from typing import List

from constance import config
import nltk
import pydantic
import validators

from ..producer import (
    LlmProducerService,
    NlpProducerService,
)
from ...util.regex import match_block_quotes


__all__ = (
    "GeneratedData",
    "GeneratedRedditorData",
    "GeneratedThreadData",
    "LlmGeneratedRedditorData",
    "LlmGeneratedThreadData",
    "NlpGeneratedRedditorData",
    "NlpGeneratedThreadData",
    "RedditDataService",
)


log = logging.getLogger("app.services.reddit.data")


class LlmGeneratedRedditorData(pydantic.BaseModel):
    age: int
    iq: int
    summary: str


class NlpGeneratedRedditorData(pydantic.BaseModel):
    sentiment_polarity: float


class GeneratedRedditorData(LlmGeneratedRedditorData, NlpGeneratedRedditorData):
    pass


class LlmGeneratedThreadData(pydantic.BaseModel):
    summary: str


class NlpGeneratedThreadData(pydantic.BaseModel):
    sentiment_polarity: float


class GeneratedThreadData(LlmGeneratedThreadData, NlpGeneratedThreadData):
    pass


GeneratedData = GeneratedRedditorData | GeneratedThreadData


class RedditDataService(abc.ABC):
    TOKENIZER = nltk.data.load("tokenizers/punkt/english.pickle")

    def __init__(self):
        self.llm = LlmProducerService(response_format=self.llm_response_format)
        self.nlp = NlpProducerService(response_format=self.nlp_response_format)

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

    def filter_submission(self, *, text: str) -> str:
        if not text or text == "[deleted]":
            return ""

        # Remove block quotes as they are someone else's words and we do not want them included in
        # the responder's submissions.
        text = match_block_quotes.sub("", text)

        # Remove excessive leading and trailing whitespace from each line.
        text = "\n".join(line.strip() for line in text.splitlines())

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

        # Do not process submissions that are either too short or too long.
        if any([
            len(retval) < config.SUBMISSION_FILTER_MIN_LENGTH,
            len(retval) > config.SUBMISSION_FILTER_MAX_LENGTH
        ]):
            retval = ""

        return retval

    @property
    @abc.abstractmethod
    def llm_response_format(self):
        pass

    @property
    @abc.abstractmethod
    def nlp_response_format(self):
        pass

    @property
    @abc.abstractmethod
    def response_format(self):
        pass
