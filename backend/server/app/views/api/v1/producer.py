from reecon.models import (
    Producer,
    ProducerCategory,
)

from ..mixins import ReadOnlyListModelViewSet
from ....serializers import ProducerSerializer


__all__ = ("LlmProducerViewSet",)


class LlmProducerViewSet(ReadOnlyListModelViewSet):
    queryset = Producer.objects.filter(category=ProducerCategory.objects.get(name="LLM"))
    serializer_class = ProducerSerializer
