from rest_framework import serializers

from reecon.serializers import ProducerSerializer

from ..validators import validate_openai_api_key


__all__ = (
    "ProducerDefaultsSerializer",
    "ProducerSettingsSerializer",
)


class ProducerDefaultsSerializer(serializers.Serializer):
    llm = ProducerSerializer(
        required=True,
    )
    nlp = ProducerSerializer(
        required=True,
    )
    prompts = serializers.DictField(
        child=serializers.CharField(),
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
