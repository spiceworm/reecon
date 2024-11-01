from rest_framework import serializers

from ..validators import validate_producer_settings


__all__ = ("ProducerSettingsSerializer",)


class ProducerSettingSerializer(serializers.Serializer):
    name = serializers.CharField(
        required=True,
    )
    api_key = serializers.CharField(
        required=True,
    )


class ProducerSettingsSerializer(serializers.Serializer):
    settings = serializers.ListSerializer(
        child=ProducerSettingSerializer(
            required=True,
        ),
        required=True,
        validators=[validate_producer_settings],
    )

    def to_internal_value(self, instance):
        """
        Convert list of dicts into a nested dict that is keyed by producer name.

        [{'api_key': '...', 'name': 'openai'}, ...]
        to
        {'openai': {'api_key': '...', 'name': 'openai'}}
        """
        internal_value = super().to_internal_value(instance)
        retval = {}
        for producer_setting in internal_value["settings"]:
            producer_name = producer_setting["name"]
            retval[producer_name] = producer_setting
        return retval
