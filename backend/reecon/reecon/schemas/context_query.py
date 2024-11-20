from typing import List

import pydantic


class LlmGeneratedContextQuery(pydantic.BaseModel):
    response: str


class GeneratedRedditorContextQuery(LlmGeneratedContextQuery):
    inputs: List[str]
    prompt: str


class GeneratedThreadContextQuery(LlmGeneratedContextQuery):
    inputs: List[str]
    prompt: str
