from rest_framework import serializers

from reecon import util
from reecon.serializers import (
    ProcessedThreadSerializer,
    ThreadContextQuerySerializer,
    UnprocessableThreadSerializer,
)

from ..producer import ProducerSettingsSerializer


__all__ = (
    "PendingThreadSerializer",
    "ThreadContextQueryCreateRequestSerializer",
    "ThreadContextQueryCreateResponseSerializer",
    "ThreadContextQueryListResponseSerializer",
    "ThreadContextQueryRetrieveResponseSerializer",
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


class ThreadDataRequestSerializer(serializers.Serializer):
    paths = serializers.ListField(child=serializers.CharField())
    producer_settings = ProducerSettingsSerializer()


class ThreadDataResponseSerializer(serializers.Serializer):
    pending = PendingThreadSerializer(many=True)
    processed = ProcessedThreadSerializer(many=True)
    unprocessable = UnprocessableThreadSerializer(many=True)
