import openai
from rest_framework import serializers


__all__ = ("validate_openai_api_key",)


def validate_openai_api_key(producer_settings: dict):
    client = openai.OpenAI(api_key=producer_settings["api_key"])
    try:
        client.models.list()
    except openai.AuthenticationError:
        raise serializers.ValidationError("OpenAI API key is invalid.")
