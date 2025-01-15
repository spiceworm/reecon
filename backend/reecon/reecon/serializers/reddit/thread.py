from rest_framework import serializers

from reecon.models import (
    Thread,
    ThreadContextQuery,
    ThreadData,
    UnprocessableThread,
    UnprocessableThreadContextQuery,
)

from ..producer import (
    ProducedFloatSerializer,
    ProducedTextSerializer,
    ProducedTextListSerializer,
)
from ..user import UserSerializer


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
    submitter = UserSerializer(
        read_only=True,
    )

    class Meta:
        model = Thread
        fields = "__all__"

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
    submitter = UserSerializer(
        read_only=True,
    )

    class Meta:
        model = UnprocessableThread
        fields = "__all__"


class ThreadContextQuerySerializer(serializers.ModelSerializer):
    context = ProcessedThreadSerializer(
        read_only=True,
    )
    response = ProducedTextSerializer(
        read_only=True,
    )

    class Meta:
        model = ThreadContextQuery
        fields = "__all__"


class UnprocessableThreadContextQuerySerializer(serializers.ModelSerializer):
    submitter = UserSerializer(
        read_only=True,
    )

    class Meta:
        model = UnprocessableThreadContextQuery
        fields = "__all__"


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
        exclude = ("thread",)
