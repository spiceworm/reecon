from rest_framework import serializers

from ..models import StatusMessage


__all__ = ("StatusMessageSerializer",)


class StatusMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusMessage
        exclude = ("active_is_computed", "id")
