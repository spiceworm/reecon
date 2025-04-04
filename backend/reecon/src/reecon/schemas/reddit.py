from typing import List

from pydantic import (
    BaseModel,
    ConfigDict,
    field_validator,
)


__all__ = ("GeneratedRedditorContextQuery", "GeneratedThreadContextQuery", "GeneratedRedditorData", "GeneratedThreadData")


class LlmUsageMetadata(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int


class LlmResponse(BaseModel):
    # If extra fields are included when creating the model, they will be ignored. This occurs when calling `model_validate.(**kwargs)`
    # if kwargs contains extra fields that are not defined in the model.
    model_config = ConfigDict(extra="forbid")

    usage_metadata: LlmUsageMetadata


class GeneratedContextQuery(LlmResponse):
    inputs: List[str]
    prompt: str
    response: str


class GeneratedData(LlmResponse):
    inputs: List[str]
    prompt: str
    sentiment_polarity: float
    sentiment_subjectivity: float
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


class GeneratedRedditorContextQuery(GeneratedContextQuery):
    pass


class GeneratedThreadContextQuery(GeneratedContextQuery):
    pass


class GeneratedRedditorData(GeneratedData):
    age: int
    interests: List[str]
    iq: int

    def normalized_interests(self) -> List[str]:
        # Use dict.fromkeys instead of set to preserve order
        return list(dict.fromkeys(s.lower() for s in self.interests))


class GeneratedThreadData(GeneratedData):
    keywords: List[str]

    def normalized_keywords(self) -> List[str]:
        # Use dict.fromkeys instead of set to preserve order
        return list(dict.fromkeys(s.lower() for s in self.keywords))
