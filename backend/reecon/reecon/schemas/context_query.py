from typing import List

import pydantic


__all__ = ("GeneratedRedditorContextQuery", "GeneratedThreadContextQuery")


class GeneratedContextQueryBase(pydantic.BaseModel):
    inputs: List[str]
    prompt: str
    response: str


class GeneratedRedditorContextQuery(GeneratedContextQueryBase):
    pass


class GeneratedThreadContextQuery(GeneratedContextQueryBase):
    pass
