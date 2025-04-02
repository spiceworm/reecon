from rest_framework import serializers

from ..data import RequestMetadataSerializer
from ...models import (
    IgnoredRedditor,
    Redditor,
    RedditorContextQuery,
    RedditorData,
    UnprocessableRedditor,
    UnprocessableRedditorContextQuery,
)

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

    class Meta:
        model = UnprocessableRedditor
        exclude = ("id",)


class RedditorContextQuerySerializer(serializers.ModelSerializer):
    context = ProcessedRedditorSerializer(
        read_only=True,
    )
    request_meta = RequestMetadataSerializer(
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
    request_meta = RequestMetadataSerializer(
        read_only=True,
    )

    class Meta:
        model = RedditorData
        exclude = (
            "id",
            "redditor",
        )
