from typing import List, Tuple

from ..models import LLM


def get_llm_choices() -> List[Tuple[str, str]]:
    return [(name, name) for name in _get_llm_names()]


def _get_llm_names() -> List[str]:
    return list(LLM.objects.values_list("name", flat=True))
