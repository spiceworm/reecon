from rest_framework import serializers


__all__ = ("StatusRequestSerializer",)


class StatusRequestSerializer(serializers.Serializer):
    messages = serializers.ListField(child=serializers.CharField())
    status = serializers.CharField(max_length=32)
