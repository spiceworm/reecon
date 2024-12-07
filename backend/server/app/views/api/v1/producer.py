from constance import config
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import Response

from reecon.models import (
    Producer,
    ProducerCategory,
)
from ..mixins import ReadOnlyListModelViewSet
from ....serializers import ProducerDefaultSettingsSerializer, ProducerSerializer


__all__ = (
    "LlmProducerViewSet",
    "NlpProducerViewSet",
    "ProducerDefaultSettingsView",
)


class LlmProducerViewSet(ReadOnlyListModelViewSet):
    serializer_class = ProducerSerializer

    def get_queryset(self):
        return Producer.objects.filter(category=ProducerCategory.objects.get(name="LLM"))


class NlpProducerViewSet(ReadOnlyListModelViewSet):
    serializer_class = ProducerSerializer

    def get_queryset(self):
        return Producer.objects.filter(category=ProducerCategory.objects.get(name="NLP"))


class ProducerDefaultSettingsView(RetrieveAPIView):
    serializer_class = ProducerDefaultSettingsSerializer

    def get(self, request, *args, **kwargs):
        data = {
            "llm": Producer.objects.get(name=config.LLM_NAME),
            "llm_context_query_prompts": {
                "redditor": config.REDDITOR_LLM_CONTEXT_QUERY_PROMPT,
                "thread": config.THREAD_LLM_CONTEXT_QUERY_PROMPT,
            },
            "llm_data_prompts": {
                "redditor": config.REDDITOR_LLM_DATA_PROMPT,
                "thread": config.THREAD_LLM_DATA_PROMPT,
            },
            "nlp": Producer.objects.get(name=config.NLP_NAME),
        }
        serializer = self.get_serializer(instance=data)
        return Response(serializer.data, status=status.HTTP_200_OK)
