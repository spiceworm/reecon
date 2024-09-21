from constance import config
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import Response


from ....serializers import StatusSerializer


__all__ = ("StatusView",)


class StatusView(RetrieveAPIView):
    authentication_classes = ()
    serializer_class = StatusSerializer

    def get(self, *args, **kwargs):
        data = {
            "messages": [
                message
                for message in [
                    config.API_V1_STATUS_MESSAGE,
                    config.REDDITOR_PROCESSING_DISABLED_MESSAGE if not config.REDDITOR_PROCESSING_ENABLED else None,
                    config.THREAD_PROCESSING_DISABLED_MESSAGE if not config.THREAD_PROCESSING_ENABLED else None,
                ]
                if message
            ],
            "status": "ok",
        }
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
