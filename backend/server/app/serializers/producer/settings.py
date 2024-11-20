from rest_framework import serializers

from ..validators import validate_openai_api_key


__all__ = ("ProducerSettingsSerializer",)


class ProducerSettingSerializer(serializers.Serializer):
    api_key = serializers.CharField(
        required=True,
    )


class ProducerSettingsSerializer(serializers.Serializer):
    openai = ProducerSettingSerializer(
        required=True,
        validators=[validate_openai_api_key],
    )
