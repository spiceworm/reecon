from rest_framework import serializers

from reecon import schemas

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

    def to_internal_value(self, data) -> schemas.LlmProviderSettings:
        return schemas.LlmProviderSettings(**data)

    def to_representation(self, instance: schemas.LlmProviderSettings) -> dict:
        return instance.model_dump()


class LlmProvidersSettingsSerializer(serializers.Serializer):
    openai = LlmProviderSettingsSerializer(
        required=True,
        validators=[validate_openai_api_key],
    )

    def to_internal_value(self, data) -> schemas.LlmProvidersSettings:
        return schemas.LlmProvidersSettings(**data)

    def to_representation(self, instance: schemas.LlmProvidersSettings) -> dict:
        return instance.model_dump()
