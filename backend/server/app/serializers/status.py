from rest_framework import serializers

from reecon.models import StatusMessage


__all__ = (
    "StatusResponseSerializer",
    "StatusMessageResponseSerializer",
)


class StatusResponseSerializer(serializers.Serializer):
    status = serializers.CharField(max_length=32, required=True)


class StatusMessageResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusMessage
        exclude = ("active_is_computed",)
