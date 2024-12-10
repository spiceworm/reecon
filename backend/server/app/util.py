from typing import List, Tuple

from reecon.models import Producer


def get_llm_choices() -> Tuple[Tuple[str, str], ...]:
    return tuple((name, name) for name in get_llm_names())


def get_llm_names() -> List[str]:
    return Producer.objects.filter(category__name="LLM").values_list("name", flat=True)


def get_nlp_choices() -> Tuple[Tuple[str, str], ...]:
    return tuple((name, name) for name in get_nlp_names())


def get_nlp_names() -> List[str]:
    return Producer.objects.filter(category__name="NLP").values_list("name", flat=True)
