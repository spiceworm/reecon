from rest_framework import serializers

from ..producer import (
    ProducedFloatSerializer,
    ProducedIntegerSerializer,
    ProducedTextSerializer,
    ProducedTextListSerializer,
    ProducerSettingsSerializer,
)
from ...models import (
    Redditor,
    RedditorData,
)


__all__ = (
    "IgnoredRedditorSerializer",
    "RedditorSerializer",
    "RedditorDataSerializer",
    "RedditorUsernameSerializer",
)


class IgnoredRedditorSerializer(serializers.Serializer):
    reason = serializers.CharField()
    username = serializers.CharField(max_length=32)


class RedditorDataSerializer(serializers.ModelSerializer):
    age = ProducedIntegerSerializer()
    interests = ProducedTextListSerializer()
    iq = ProducedIntegerSerializer()
    sentiment_polarity = ProducedFloatSerializer()
    summary = ProducedTextSerializer()

    class Meta:
        model = RedditorData
        exclude = ("id", "redditor")


class RedditorSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField("get_data")

    class Meta:
        model = Redditor
        exclude = ("id",)

    def get_data(self, redditor: Redditor):
        """
        Even though we are storing all RedditorData entries, we only want to serialize
        the latest one, not all of them.
        """
        data = RedditorData.objects.filter(redditor=redditor).latest("created")
        serializer = RedditorDataSerializer(instance=data)
        return serializer.data


class RedditorUsernameSerializer(serializers.Serializer):
    usernames = serializers.ListField(child=serializers.CharField())
    producer_settings = ProducerSettingsSerializer(required=True)
