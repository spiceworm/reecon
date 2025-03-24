import openai
from rest_framework import serializers


__all__ = ("validate_openai_api_key",)


def validate_openai_api_key(settings: dict):
    client = openai.OpenAI(api_key=settings["api_key"], timeout=5)
    try:
        client.models.list()
    except openai.AuthenticationError:
        raise serializers.ValidationError("OpenAI API key is invalid.")
    except openai.APIStatusError:
        # If the OpenAI API is throwing errors, do not allow their downtime to cause downtime in reecon.
        # Assume the provided api key is valid so that the reecon API can still serve processed data.
        # We can assume the api key is valid because when the user initially enters it in the extension,
        # it will not be stored unless it passes a validation test.
        pass
