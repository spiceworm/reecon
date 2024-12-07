from rest_framework import serializers

from reecon.models import (
    IgnoredRedditor,
    Redditor,
    RedditorContextQuery,
    RedditorData,
    UnprocessableRedditor,
    UnprocessableRedditorContextQuery,
)

from ..user import UserSerializer
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
    "RedditorContextQueryListResponseSerializer",
    "RedditorContextQueryRetrieveResponseSerializer",
    "RedditorDataSerializer",
    "RedditorDataRequestSerializer",
    "RedditorDataResponseSerializer",
)


class IgnoredRedditorSerializer(serializers.ModelSerializer):
    identifier = serializers.CharField(
        read_only=True,
    )
    source = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = IgnoredRedditor
        fields = "__all__"


class PendingRedditorSerializer(serializers.Serializer):
    username = serializers.CharField(
        read_only=True,
    )


class ProcessedRedditorSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField(
        "get_data",
        read_only=True,
    )
    identifier = serializers.CharField(
        read_only=True,
    )
    source = serializers.CharField(
        read_only=True,
    )
    submitter = UserSerializer(
        read_only=True,
    )

    class Meta:
        model = Redditor
        fields = "__all__"

    def get_data(self, redditor: Redditor) -> dict:
        """
        Even though we are storing all RedditorData entries, we only want to serialize
        the latest one, not all of them.
        """
        data = redditor.data.latest("created")
        serializer = RedditorDataSerializer(instance=data)
        return serializer.data


class UnprocessableRedditorSerializer(serializers.ModelSerializer):
    identifier = serializers.CharField(
        read_only=True,
    )
    source = serializers.CharField(
        read_only=True,
    )
    submitter = UserSerializer(
        read_only=True,
    )

    class Meta:
        model = UnprocessableRedditor
        fields = "__all__"


class RedditorContextQuerySerializer(serializers.ModelSerializer):
    context = ProcessedRedditorSerializer(
        read_only=True,
    )
    response = ProducedTextSerializer(
        read_only=True,
    )
    submitter = UserSerializer(
        read_only=True,
    )

    class Meta:
        model = RedditorContextQuery
        fields = "__all__"


class UnprocessableRedditorContextQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = UnprocessableRedditorContextQuery
        fields = "__all__"


class RedditorContextQueryCreateRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    prompt = serializers.CharField()
    producer_settings = ProducerSettingsSerializer()


class RedditorContextQueryCreateResponseSerializer(serializers.Serializer):
    job_id = serializers.CharField()


RedditorContextQueryListResponseSerializer = RedditorContextQuerySerializer


class RedditorContextQueryRetrieveResponseSerializer(serializers.Serializer):
    error = UnprocessableRedditorSerializer(
        default=None,
        read_only=True,
    )
    success = RedditorContextQuerySerializer(
        default=None,
        read_only=True,
    )


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
        exclude = ("redditor",)


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
