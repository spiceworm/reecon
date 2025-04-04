from rest_framework import serializers

from reecon import util
from reecon.serializers import (
    IgnoredRedditorSerializer,
    ProcessedRedditorSerializer,
    RedditorContextQuerySerializer,
    UnprocessableRedditorSerializer,
    UnprocessableRedditorContextQuerySerializer,
)

from ..llm import LlmProvidersSettingsSerializer


__all__ = (
    "PendingRedditorSerializer",
    "RedditorContextQueryCreateRequestSerializer",
    "RedditorContextQueryCreateResponseSerializer",
    "RedditorContextQueryListResponseSerializer",
    "RedditorContextQueryRetrieveResponseSerializer",
    "RedditorDataRequestSerializer",
    "RedditorDataResponseSerializer",
)


class PendingRedditorSerializer(serializers.Serializer):
    username = serializers.CharField(
        read_only=True,
    )


class RedditorContextQueryCreateRequestSerializer(serializers.Serializer):
    llm_name = serializers.ChoiceField(choices=[])
    llm_providers_settings = LlmProvidersSettingsSerializer()
    prompt = serializers.CharField()
    username = serializers.CharField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["llm_name"].choices = util.fields.get_llm_choices()


class RedditorContextQueryCreateResponseSerializer(serializers.Serializer):
    job_id = serializers.CharField()


RedditorContextQueryListResponseSerializer = RedditorContextQuerySerializer


class RedditorContextQueryRetrieveResponseSerializer(serializers.Serializer):
    error = UnprocessableRedditorContextQuerySerializer(
        default=None,
        read_only=True,
    )
    success = RedditorContextQuerySerializer(
        default=None,
        read_only=True,
    )


class RedditorDataRequestSerializer(serializers.Serializer):
    usernames = serializers.ListField(
        child=serializers.CharField(),
        required=True,
    )
    llm_providers_settings = LlmProvidersSettingsSerializer(
        required=True,
    )


class RedditorDataResponseSerializer(serializers.Serializer):
    ignored = IgnoredRedditorSerializer(many=True)
    pending = PendingRedditorSerializer(many=True)
    processed = ProcessedRedditorSerializer(many=True)
    unprocessable = UnprocessableRedditorSerializer(many=True)
