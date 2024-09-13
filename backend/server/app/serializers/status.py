from rest_framework import serializers


__all__ = ("StatusSerializer",)


class StatusSerializer(serializers.Serializer):
    status = serializers.CharField(max_length=32)
