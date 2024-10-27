from rest_framework import serializers


__all__ = (
    "ValidateProducerSettingsRequestSerializer",
    "ValidateProducerSettingsResponseSerializer",
)


class ValidateProducerSettingsRequestSerializer(serializers.Serializer):
    producer_name = serializers.CharField()
    api_key = serializers.CharField()


class ValidateProducerSettingsResponseSerializer(serializers.Serializer):
    settings = serializers.DictField(required=True)
