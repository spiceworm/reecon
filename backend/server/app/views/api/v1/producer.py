from reecon.models import (
    Producer,
    ProducerCategory,
)

from ..mixins import ReadOnlyListModelViewSet
from ....serializers import ProducerSerializer


__all__ = ("LlmProducerViewSet",)


class LlmProducerViewSet(ReadOnlyListModelViewSet):
    serializer_class = ProducerSerializer

    def get_queryset(self):
        return Producer.objects.filter(category=ProducerCategory.objects.get(name="LLM"))
