from constance import config
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import Response

from reecon.models import (
    Producer,
    ProducerCategory,
)
from ..mixins import ReadOnlyListModelViewSet
from ....serializers import (
    ProducerDefaultsSerializer,
    ProducerSerializer,
)


__all__ = (
    "LlmProducerViewSet",
    "NlpProducerViewSet",
    "ProducerDefaultsView",
)


class LlmProducerViewSet(ReadOnlyListModelViewSet):
    serializer_class = ProducerSerializer

    def get_queryset(self):
        return Producer.objects.filter(category=ProducerCategory.objects.get(name="LLM"))


class NlpProducerViewSet(ReadOnlyListModelViewSet):
    serializer_class = ProducerSerializer

    def get_queryset(self):
        return Producer.objects.filter(category=ProducerCategory.objects.get(name="NLP"))


class ProducerDefaultsView(RetrieveAPIView):
    serializer_class = ProducerDefaultsSerializer

    def retrieve(self, request, *args, **kwargs):
        data = {
            "llm": Producer.objects.get(name=config.LLM_NAME),
            "nlp": Producer.objects.get(name=config.NLP_NAME),
            "prompts": {
                "process_redditor_context_query": config.REDDITOR_LLM_CONTEXT_QUERY_PROMPT,
                "process_redditor_data": config.REDDITOR_LLM_DATA_PROMPT,
                "process_thread_context_query": config.THREAD_LLM_CONTEXT_QUERY_PROMPT,
                "process_thread_data": config.THREAD_LLM_DATA_PROMPT,
            }
        }
        serializer = self.get_serializer(instance=data)
        return Response(serializer.data, status=status.HTTP_200_OK)
