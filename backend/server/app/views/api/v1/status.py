from rest_framework.generics import RetrieveAPIView
from rest_framework.views import Response


from ....serializers import StatusSerializer


__all__ = ("StatusView",)


class StatusView(RetrieveAPIView):
    authentication_classes = ()
    serializer_class = StatusSerializer

    def get(self, *args, **kwargs):
        return Response({"status": "ok"})
