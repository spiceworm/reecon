from typing import List

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


__all__ = ("GeneratedRedditorData", "GeneratedThreadData")


class GeneratedDataBase(BaseModel):
    inputs: List[str]
    prompt: str
    sentiment_polarity: float
    #     Field(
    #     ge=-1.0,
    #     le=1.0,
    # )
    sentiment_subjectivity: float
    #     Field(
    #     ge=0.0,
    #     le=1.0,
    # )
    summary: str

    # Using field validators is temporary until OpenAI adds support for type-specific keywords that are not yet supported
    # https://platform.openai.com/docs/guides/structured-outputs/some-type-specific-keywords-are-not-yet-supported#some-type-specific-keywords-are-not-yet-supported
    @field_validator("sentiment_polarity", mode="after")
    def validate_sentiment_polarity(cls, value: float) -> float:
        if not (-1.0 <= value <= 1.0):
            raise ValueError("sentiment_polarity must be between -1.0 and 1.0")
        return value

    @field_validator("sentiment_subjectivity", mode="after")
    def validate_sentiment_subjectivity(cls, value: float) -> float:
        if not (0.0 <= value <= 1.0):
            raise ValueError("sentiment_subjectivity must be between 0.0 and 1.0")
        return value


class GeneratedRedditorData(GeneratedDataBase):
    age: int
    interests: List[str]
    iq: int

    def normalized_interests(self) -> List[str]:
        return list(set([s.lower() for s in self.interests]))


class GeneratedThreadData(GeneratedDataBase):
    keywords: List[str]

    def normalized_keywords(self) -> List[str]:
        return list(set([s.lower() for s in self.keywords]))
