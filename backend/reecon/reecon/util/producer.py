from typing import List, Tuple

from reecon.models import Producer


__all__ = (
    "get_llm_choices",
    "get_nlp_choices",
)


def get_llm_choices() -> List[Tuple[str, str]]:
    return [(name, name) for name in _get_llm_names()]


def _get_llm_names() -> List[str]:
    return Producer.objects.filter(category__name="LLM").values_list("name", flat=True)


def get_nlp_choices() -> List[Tuple[str, str]]:
    return [(name, name) for name in _get_nlp_names()]


def _get_nlp_names() -> List[str]:
    return Producer.objects.filter(category__name="NLP").values_list("name", flat=True)
