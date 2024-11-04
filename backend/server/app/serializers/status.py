from rest_framework import serializers


__all__ = ("StatusRequestSerializer",)


class StatusMessageSerializer(serializers.Serializer):
    active = serializers.BooleanField(required=True)
    category = serializers.CharField(required=True)
    message = serializers.CharField(required=True)
    name = serializers.CharField(required=True)
    source = serializers.CharField(required=True)


class StatusRequestSerializer(serializers.Serializer):
    messages = StatusMessageSerializer(many=True, required=True)
    status = serializers.CharField(max_length=32, required=True)
