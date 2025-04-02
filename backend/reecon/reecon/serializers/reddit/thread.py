from rest_framework import serializers

from ..data import RequestMetadataSerializer
from ...models import (
    Thread,
    ThreadContextQuery,
    ThreadData,
    UnprocessableThread,
    UnprocessableThreadContextQuery,
)


__all__ = (
    "ProcessedThreadSerializer",
    "ThreadContextQuerySerializer",
    "ThreadDataSerializer",
    "UnprocessableThreadContextQuerySerializer",
    "UnprocessableThreadSerializer",
)


class ProcessedThreadSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField(
        "get_data",
        read_only=True,
    )
    identifier = serializers.CharField(
        read_only=True,
    )
    path = serializers.CharField(
        read_only=True,
    )
    source = serializers.CharField(
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
        data = thread.data.latest("created")
        serializer = ThreadDataSerializer(instance=data)
        return serializer.data


class UnprocessableThreadSerializer(serializers.ModelSerializer):
    identifier = serializers.CharField(
        read_only=True,
    )
    path = serializers.CharField(
        read_only=True,
    )
    source = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = UnprocessableThread
        exclude = ("id",)


class ThreadContextQuerySerializer(serializers.ModelSerializer):
    context = ProcessedThreadSerializer(
        read_only=True,
    )
    request_meta = RequestMetadataSerializer(
        read_only=True,
    )

    class Meta:
        model = ThreadContextQuery
        exclude = ("id",)


class UnprocessableThreadContextQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = UnprocessableThreadContextQuery
        exclude = ("id",)


class ThreadDataSerializer(serializers.ModelSerializer):
    request_meta = RequestMetadataSerializer(
        read_only=True,
    )

    class Meta:
        model = ThreadData
        exclude = (
            "id",
            "thread",
        )
