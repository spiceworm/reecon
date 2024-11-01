from rest_framework import serializers

from ..producer import (
    ProducedFloatSerializer,
    ProducedTextSerializer,
    ProducedTextListSerializer,
    ProducerSettingsSerializer,
)
from ...models import (
    Thread,
    ThreadData,
)


__all__ = (
    "ThreadDataSerializer",
    "ThreadRequestSerializer",
    "ThreadResponseSerializer",
)


class ThreadDataSerializer(serializers.ModelSerializer):
    keywords = ProducedTextListSerializer(
        read_only=True,
    )
    sentiment_polarity = ProducedFloatSerializer(
        read_only=True,
    )
    summary = ProducedTextSerializer(
        read_only=True,
    )

    class Meta:
        model = ThreadData
        exclude = ("id", "thread")


class ThreadResponseSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField(
        "get_data",
        read_only=True,
    )
    path = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = Thread
        exclude = ("id",)

    def get_data(self, thread: Thread) -> dict:
        """
        Even though we are storing all ThreadData entries, we only want to serialize
        the latest one, not all of them.
        """
        data = ThreadData.objects.filter(thread=thread).latest("created")
        serializer = ThreadDataSerializer(instance=data)
        return serializer.data


class ThreadRequestSerializer(serializers.Serializer):
    paths = serializers.ListField(child=serializers.CharField())
    producer_settings = ProducerSettingsSerializer()
