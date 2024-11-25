from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import Response

from reecon.models import StatusMessage

from ..mixins import ReadOnlyListModelViewSet
from ....serializers import StatusMessageRequestSerializer, StatusRequestSerializer


__all__ = (
    "StatusView",
    "StatusMessagesViewSet",
)


class StatusView(RetrieveAPIView):
    authentication_classes = ()
    serializer_class = StatusRequestSerializer

    def get(self, *args, **kwargs):
        data = {"status": "ok"}
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StatusMessagesViewSet(ReadOnlyListModelViewSet):
    queryset = StatusMessage.objects.all()
    serializer_class = StatusMessageRequestSerializer
