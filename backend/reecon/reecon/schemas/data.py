from typing import List

import pydantic


class LlmGeneratedRedditorData(pydantic.BaseModel):
    age: int
    interests: List[str]
    iq: int
    summary: str

    def normalized_interests(self) -> List[str]:
        lowercase = [s.lower() for s in self.interests]
        hyphenated = ["-".join(s.split()) for s in lowercase]
        return list(set(hyphenated))


class LlmGeneratedThreadData(pydantic.BaseModel):
    keywords: List[str]
    summary: str

    def normalized_keywords(self) -> List[str]:
        lowercase = [s.lower() for s in self.keywords]
        hyphenated = ["-".join(s.split()) for s in lowercase]
        return list(set(hyphenated))


class NlpGeneratedRedditorData(pydantic.BaseModel):
    sentiment_polarity: float
    sentiment_subjectivity: float


class NlpGeneratedThreadData(pydantic.BaseModel):
    sentiment_polarity: float
    sentiment_subjectivity: float


class GeneratedRedditorData(LlmGeneratedRedditorData, NlpGeneratedRedditorData):
    inputs: List[str]
    prompt: str


class GeneratedThreadData(LlmGeneratedThreadData, NlpGeneratedThreadData):
    inputs: List[str]
    prompt: str
