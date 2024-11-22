from rest_framework import serializers

from reecon.models import (
    Redditor,
    RedditorContextQuery,
    RedditorData,
    UnprocessableRedditor,
)

from ..producer import (
    ProducedFloatSerializer,
    ProducedIntegerSerializer,
    ProducedTextSerializer,
    ProducedTextListSerializer,
    ProducerSettingsSerializer,
)


__all__ = (
    "RedditorContextQueryCreateRequestSerializer",
    "RedditorContextQueryCreateResponseSerializer",
    "RedditorContextQueryRetrieveResponseSerializer",
    "RedditorDataSerializer",
    "RedditorDataRequestSerializer",
    "RedditorDataResponseSerializer",
)


class IgnoredRedditorSerializer(serializers.Serializer):
    reason = serializers.CharField(
        read_only=True,
    )
    username = serializers.CharField(
        max_length=32,
        read_only=True,
    )


class PendingRedditorSerializer(serializers.Serializer):
    username = serializers.CharField(
        read_only=True,
    )


class ProcessedRedditorSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField(
        "get_data",
        read_only=True,
    )

    class Meta:
        model = Redditor
        exclude = ("id",)

    def get_data(self, redditor: Redditor) -> dict:
        """
        Even though we are storing all RedditorData entries, we only want to serialize
        the latest one, not all of them.
        """
        data = RedditorData.objects.filter(redditor=redditor).latest("created")
        serializer = RedditorDataSerializer(instance=data)
        return serializer.data


class UnprocessableRedditorSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnprocessableRedditor
        exclude = ("id",)


class RedditorContextQuerySerializer(serializers.ModelSerializer):
    response = ProducedTextSerializer(
        read_only=True,
    )

    class Meta:
        model = RedditorContextQuery
        exclude = ("id",)


class RedditorContextQueryCreateRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    prompt = serializers.CharField()
    producer_settings = ProducerSettingsSerializer()


class RedditorContextQueryCreateResponseSerializer(serializers.Serializer):
    job_id = serializers.CharField()


RedditorContextQueryRetrieveResponseSerializer = RedditorContextQuerySerializer


class RedditorDataSerializer(serializers.ModelSerializer):
    age = ProducedIntegerSerializer(
        read_only=True,
    )
    interests = ProducedTextListSerializer(
        read_only=True,
    )
    iq = ProducedIntegerSerializer(
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
        model = RedditorData
        exclude = ("id", "redditor")


class RedditorDataRequestSerializer(serializers.Serializer):
    usernames = serializers.ListField(
        child=serializers.CharField(),
        required=True,
    )
    producer_settings = ProducerSettingsSerializer(
        required=True,
    )


class RedditorDataResponseSerializer(serializers.Serializer):
    ignored = IgnoredRedditorSerializer(many=True)
    pending = PendingRedditorSerializer(many=True)
    processed = ProcessedRedditorSerializer(many=True)
    unprocessable = UnprocessableRedditorSerializer(many=True)
