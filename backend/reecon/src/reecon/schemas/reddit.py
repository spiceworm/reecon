from typing import List

from pydantic import (
    Field,
    field_validator,
)

from .llm import (
    LlmInput,
    LlmResponse,
)


__all__ = (
    "GeneratedRedditorContextQuery",
    "GeneratedRedditorContextQueryWithContext",
    "GeneratedThreadContextQuery",
    "GeneratedThreadContextQueryWithContext",
    "GeneratedRedditorData",
    "GeneratedRedditorDataWithContext",
    "GeneratedThreadData",
    "GeneratedThreadDataWithContext",
)


class GeneratedContextQuery(LlmResponse):
    response: str


class GeneratedData(LlmResponse):
    sentiment_polarity: float = Field(
        description="Sentiment polarity value within the range [-1.0, 1.0] where -1.0 is very negative and 1.0 is very positive.",
    )
    sentiment_subjectivity: float = Field(
        description="Sentiment subjectivity value within the range [0.0, 1.0] where 0.0 is very objective and 1.0 is very subjective.",
    )
    summary: str = Field(description="High level summary of the submissions with general assumptions that can be extrapolated from them.")

    # Using field validators is temporary until OpenAI adds support for type-specific keywords that are not yet supported
    # https://platform.openai.com/docs/guides/structured-outputs/some-type-specific-keywords-are-not-yet-supported#some-type-specific-keywords-are-not-yet-supported
    @field_validator("sentiment_polarity", mode="after")
    @classmethod
    def validate_sentiment_polarity(cls, value: float) -> float:
        if not (-1.0 <= value <= 1.0):
            raise ValueError("sentiment_polarity must be between -1.0 and 1.0")
        return value

    @field_validator("sentiment_subjectivity", mode="after")
    @classmethod
    def validate_sentiment_subjectivity(cls, value: float) -> float:
        if not (0.0 <= value <= 1.0):
            raise ValueError("sentiment_subjectivity must be between 0.0 and 1.0")
        return value


class GeneratedRedditorContextQuery(GeneratedContextQuery):
    pass


class GeneratedRedditorContextQueryWithContext(GeneratedRedditorContextQuery):
    inputs: List[LlmInput]
    prompt: str


class GeneratedThreadContextQuery(GeneratedContextQuery):
    pass


class GeneratedThreadContextQueryWithContext(GeneratedThreadContextQuery):
    inputs: List[LlmInput]
    prompt: str


class GeneratedRedditorData(GeneratedData):
    age: int = Field(description="Age of the redditor.")
    interests: List[str] = Field(
        description="List of interests of the redditor ordered from most to least relevant. These should be individual or hyphenated words.",
    )
    iq: int = Field(description="Estimated IQ of the redditor.")

    def normalized_interests(self) -> List[str]:
        # Use dict.fromkeys instead of set to preserve order
        return list(dict.fromkeys(s.lower() for s in self.interests))


class GeneratedRedditorDataWithContext(GeneratedRedditorData):
    inputs: List[LlmInput]
    prompt: str


class GeneratedThreadData(GeneratedData):
    keywords: List[str] = Field(
        description="List of keywords related to the thread ordered from most to least relevant. These should be individual or hyphenated words.",
    )

    def normalized_keywords(self) -> List[str]:
        # Use dict.fromkeys instead of set to preserve order
        return list(dict.fromkeys(s.lower() for s in self.keywords))


class GeneratedThreadDataWithContext(GeneratedThreadData):
    inputs: List[LlmInput]
    prompt: str
