from rest_framework import serializers

from .producer import ProducerSerializer
from ..validators import validate_openai_api_key


__all__ = (
    "ProducerDefaultSettingsSerializer",
    "ProducerSettingsSerializer",
)


class LlmPromptsSerializer(serializers.Serializer):
    redditor = serializers.CharField()
    thread = serializers.CharField()


class ProducerDefaultSettingsSerializer(serializers.Serializer):
    llm = ProducerSerializer(
        required=True,
    )
    llm_context_query_prompts = LlmPromptsSerializer(
        required=True,
    )
    llm_data_prompts = LlmPromptsSerializer(
        required=True,
    )
    nlp = ProducerSerializer(
        required=True,
    )


class ProducerSettingSerializer(serializers.Serializer):
    api_key = serializers.CharField(
        required=True,
    )


class ProducerSettingsSerializer(serializers.Serializer):
    openai = ProducerSettingSerializer(
        required=True,
        validators=[validate_openai_api_key],
    )
