from rest_framework import serializers

from reecon.models import (
    IgnoredRedditor,
    Redditor,
    RedditorContextQuery,
    RedditorData,
    UnprocessableRedditor,
    UnprocessableRedditorContextQuery,
)

from ..producer import (
    ProducedFloatSerializer,
    ProducedIntegerSerializer,
    ProducedTextSerializer,
    ProducedTextListSerializer,
)
from ..user import UserSerializer


__all__ = (
    "IgnoredRedditorSerializer",
    "ProcessedRedditorSerializer",
    "RedditorContextQuerySerializer",
    "RedditorDataSerializer",
    "UnprocessableRedditorContextQuerySerializer",
    "UnprocessableRedditorSerializer",
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
        exclude = ("id",)


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
        fields=("username",),
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
        fields=("username",),
        read_only=True,
    )

    class Meta:
        model = UnprocessableRedditor
        exclude = ("id",)


class RedditorContextQuerySerializer(serializers.ModelSerializer):
    context = ProcessedRedditorSerializer(
        read_only=True,
    )
    response = ProducedTextSerializer(
        read_only=True,
    )
    submitter = UserSerializer(
        fields=("username",),
        read_only=True,
    )

    class Meta:
        model = RedditorContextQuery
        exclude = ("id",)


class UnprocessableRedditorContextQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = UnprocessableRedditorContextQuery
        exclude = ("id",)


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
        exclude = (
            "id",
            "redditor",
        )
