from rest_framework import status
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.views import Response


from ....models import StatusMessage
from ....serializers import StatusMessageRequestSerializer, StatusRequestSerializer


__all__ = (
    "StatusView",
    "StatusMessagesView",
)


class StatusView(RetrieveAPIView):
    authentication_classes = ()
    serializer_class = StatusRequestSerializer

    def get(self, *args, **kwargs):
        data = {"status": "ok"}
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StatusMessagesView(ListAPIView):
    queryset = StatusMessage.objects.filter(active=True)
    serializer_class = StatusMessageRequestSerializer
