from rest_framework import serializers

from .validators import validate_openai_api_key


__all__ = (
    "LlmDefaultsSerializer",
    "LlmProvidersSettingsSerializer",
)


class LlmDefaultsSerializer(serializers.Serializer):
    prompts = serializers.DictField(
        child=serializers.CharField(),
        required=True,
    )


class LlmProviderSettingsSerializer(serializers.Serializer):
    api_key = serializers.CharField(
        required=True,
    )


class LlmProvidersSettingsSerializer(serializers.Serializer):
    openai = LlmProviderSettingsSerializer(
        required=True,
        validators=[validate_openai_api_key],
    )
