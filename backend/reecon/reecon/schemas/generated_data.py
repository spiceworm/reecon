from typing import List

from pydantic import (
    BaseModel,
    Field,
)


__all__ = ("GeneratedRedditorData", "GeneratedThreadData")


class GeneratedDataBase(BaseModel):
    inputs: List[str]
    prompt: str
    sentiment_polarity: float = Field(
        ge=-1.0,
        le=1.0,
    )
    sentiment_subjectivity: float = Field(
        ge=0.0,
        le=1.0,
    )
    summary: str


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
