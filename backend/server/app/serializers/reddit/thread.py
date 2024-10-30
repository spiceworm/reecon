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
    "ThreadSerializer",
    "ThreadDataSerializer",
    "ThreadUrlPathsSerializer",
)


class ThreadDataSerializer(serializers.ModelSerializer):
    keywords = ProducedTextListSerializer()
    sentiment_polarity = ProducedFloatSerializer()
    summary = ProducedTextSerializer()

    class Meta:
        model = ThreadData
        exclude = ("id", "thread")


class ThreadSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField("get_data")
    path = serializers.CharField()

    class Meta:
        model = Thread
        exclude = ("id",)

    def get_data(self, thread: Thread):
        """
        Even though we are storing all ThreadData entries, we only want to serialize
        the latest one, not all of them.
        """
        data = ThreadData.objects.filter(thread=thread).latest("created")
        serializer = ThreadDataSerializer(instance=data)
        return serializer.data


class ThreadUrlPathsSerializer(serializers.Serializer):
    paths = serializers.ListField(child=serializers.CharField())
    producer_settings = ProducerSettingsSerializer(required=True)
