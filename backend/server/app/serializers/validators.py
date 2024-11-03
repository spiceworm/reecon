from typing import List

import openai
from rest_framework import serializers


__all__ = ("validate_producer_settings",)


def _validate_openai_api_key(api_key: str):
    client = openai.OpenAI(api_key=api_key)
    try:
        client.models.list()
    except openai.AuthenticationError:
        raise serializers.ValidationError("OpenAI API key is invalid.")


def _validate_api_key(producer_name: str, producer_api_key: str):
    match producer_name:
        case "openai":
            _validate_openai_api_key(producer_api_key)
        case _:
            raise NotImplementedError(producer_name)


def validate_producer_settings(producer_settings: List[dict]):
    for producer_setting in producer_settings:
        producer_name = producer_setting["name"]
        producer_api_key = producer_setting["api_key"]
        _validate_api_key(producer_name, producer_api_key)
