from rest_framework import serializers


__all__ = (
    "StatusRequestSerializer",
    "StatusMessagesRequestSerializer",
)


class StatusRequestSerializer(serializers.Serializer):
    status = serializers.CharField(max_length=32, required=True)


class StatusMessagesRequestSerializer(serializers.Serializer):
    active = serializers.BooleanField(required=True)
    category = serializers.CharField(required=True)
    message = serializers.CharField(required=True)
    name = serializers.CharField(required=True)
    source = serializers.CharField(required=True)
