from rest_framework import serializers

from reecon.models import (
    Thread,
    ThreadContextQuery,
    ThreadData,
    UnprocessableThread,
    UnprocessableThreadContextQuery,
)
from reecon import util

from ..producer import (
    ProducedFloatSerializer,
    ProducedTextSerializer,
    ProducedTextListSerializer,
    ProducerSettingsSerializer,
)
from ..user import UserSerializer


__all__ = (
    "ThreadContextQueryCreateRequestSerializer",
    "ThreadContextQueryCreateResponseSerializer",
    "ThreadContextQueryListResponseSerializer",
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


class ThreadContextQueryCreateRequestSerializer(serializers.Serializer):
    llm_name = serializers.ChoiceField(choices=[])
    nlp_name = serializers.ChoiceField(choices=[])
    path = serializers.CharField()
    producer_settings = ProducerSettingsSerializer()
    prompt = serializers.CharField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["llm_name"].choices = util.producer.get_llm_choices()
        self.fields["nlp_name"].choices = util.producer.get_nlp_choices()


class ThreadContextQueryCreateResponseSerializer(serializers.Serializer):
    job_id = serializers.CharField()


ThreadContextQueryListResponseSerializer = ThreadContextQuerySerializer


class ThreadContextQueryRetrieveResponseSerializer(serializers.Serializer):
    error = UnprocessableThreadSerializer(
        default=None,
        read_only=True,
    )
    success = ThreadContextQuerySerializer(
        default=None,
        read_only=True,
    )


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


class ThreadDataRequestSerializer(serializers.Serializer):
    paths = serializers.ListField(child=serializers.CharField())
    producer_settings = ProducerSettingsSerializer()


class ThreadDataResponseSerializer(serializers.Serializer):
    pending = PendingThreadSerializer(many=True)
    processed = ProcessedThreadSerializer(many=True)
    unprocessable = UnprocessableThreadSerializer(many=True)
