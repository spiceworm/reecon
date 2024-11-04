from constance import config
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import Response


from ....serializers import StatusRequestSerializer


__all__ = ("StatusView",)


class StatusView(RetrieveAPIView):
    authentication_classes = ()
    serializer_class = StatusRequestSerializer

    def get(self, *args, **kwargs):
        messages = [
            {
                "active": bool(config.API_V1_STATUS_MESSAGE),
                "category": "info",
                "message": config.API_V1_STATUS_MESSAGE,
                "name": "apiStatusMessage",
                "source": "api",
            },
            {
                "active": not config.REDDITOR_PROCESSING_ENABLED,
                "category": "info",
                "message": config.REDDITOR_PROCESSING_DISABLED_MESSAGE,
                "name": "redditorProcessingDisabled",
                "source": "api",
            },
            {
                "active": not config.THREAD_PROCESSING_ENABLED,
                "category": "info",
                "message": config.THREAD_PROCESSING_DISABLED_MESSAGE,
                "name": "threadProcessingDisabled",
                "source": "api",
            }
        ]

        data = {
            "messages": [message for message in messages if message["active"]],
            "status": "ok",
        }
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
