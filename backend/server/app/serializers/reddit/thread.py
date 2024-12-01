from rest_framework import serializers

from reecon.models import (
    Thread,
    ThreadContextQuery,
    ThreadData,
    UnprocessableThread,
)

from ..producer import (
    ProducedFloatSerializer,
    ProducedTextSerializer,
    ProducedTextListSerializer,
    ProducerSettingsSerializer,
)


__all__ = (
    "ThreadContextQueryCreateRequestSerializer",
    "ThreadContextQueryCreateResponseSerializer",
    "ThreadContextQueryRetrieveResponseSerializer",
    "ThreadDataSerializer",
    "ThreadDataRequestSerializer",
    "ThreadDataResponseSerializer",
)


class PendingThreadSerializer(serializers.Serializer):
    path = serializers.CharField(
        read_only=True,
    )
    url = serializers.URLField(
        read_only=True,
    )


class ProcessedThreadSerializer(serializers.ModelSerializer):
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


class UnprocessableThreadSerializer(serializers.ModelSerializer):
    path = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = UnprocessableThread
        exclude = ("id",)


class ThreadContextQuerySerializer(serializers.ModelSerializer):
    response = ProducedTextSerializer(
        read_only=True,
    )

    class Meta:
        model = ThreadContextQuery
        exclude = ("id",)


class ThreadContextQueryCreateRequestSerializer(serializers.Serializer):
    path = serializers.CharField()
    prompt = serializers.CharField()
    producer_settings = ProducerSettingsSerializer()


class ThreadContextQueryCreateResponseSerializer(serializers.Serializer):
    job_id = serializers.CharField()


ThreadContextQueryRetrieveResponseSerializer = ThreadContextQuerySerializer


class ThreadDataSerializer(serializers.ModelSerializer):
    keywords = ProducedTextListSerializer(
        read_only=True,
    )
    sentiment_polarity = ProducedFloatSerializer(
        read_only=True,
    )
    sentiment_subjectivity = ProducedFloatSerializer(
        read_only=True,
    )
    summary = ProducedTextSerializer(
        read_only=True,
    )

    class Meta:
        model = ThreadData
        exclude = ("id", "thread")


class ThreadDataRequestSerializer(serializers.Serializer):
    paths = serializers.ListField(child=serializers.CharField())
    producer_settings = ProducerSettingsSerializer()


class ThreadDataResponseSerializer(serializers.Serializer):
    pending = PendingThreadSerializer(many=True)
    processed = ProcessedThreadSerializer(many=True)
    unprocessable = UnprocessableThreadSerializer(many=True)
