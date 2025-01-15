from rest_framework import serializers

from reecon.serializers import StatusMessageSerializer


__all__ = (
    "StatusResponseSerializer",
    "StatusMessageResponseSerializer",
)


class StatusResponseSerializer(serializers.Serializer):
    status = serializers.CharField(max_length=32, required=True)


StatusMessageResponseSerializer = StatusMessageSerializer
