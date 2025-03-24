from constance import config
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import Response

from reecon.models import LLM
from reecon.serializers import LlmSerializer

from ..mixins import ReadOnlyListModelViewSet
from ....serializers import LlmDefaultsSerializer

__all__ = (
    "LlmDefaultsView",
    "LlmViewSet",
)


class LlmDefaultsView(RetrieveAPIView):
    serializer_class = LlmDefaultsSerializer

    def retrieve(self, request, *args, **kwargs):
        data = {
            "prompts": {
                "process_redditor_context_query": config.REDDITOR_LLM_CONTEXT_QUERY_PROMPT,
                "process_redditor_data": config.REDDITOR_LLM_DATA_PROMPT,
                "process_thread_context_query": config.THREAD_LLM_CONTEXT_QUERY_PROMPT,
                "process_thread_data": config.THREAD_LLM_DATA_PROMPT,
            },
        }
        serializer = self.get_serializer(instance=data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LlmViewSet(ReadOnlyListModelViewSet):
    queryset = LLM.objects.all()
    serializer_class = LlmSerializer
