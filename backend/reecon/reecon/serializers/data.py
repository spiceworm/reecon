from rest_framework import serializers

from .user import UserSerializer
from ..models import (
    LLM,
    LlmProvider,
    RequestMetadata,
)


__all__ = (
    "LlmSerializer",
    "LlmProviderSerializer",
    "RequestMetadataSerializer",
)


class LlmProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = LlmProvider
        exclude = (
            "created",
            "id",
        )


class LlmSerializer(serializers.ModelSerializer):
    provider = LlmProviderSerializer(
        read_only=True,
    )

    class Meta:
        model = LLM
        exclude = (
            "created",
            "id",
        )


class RequestMetadataSerializer(serializers.ModelSerializer):
    contributor = UserSerializer(
        fields=("username",),
        read_only=True,
    )
    llm = LlmSerializer(
        read_only=True,
    )
    submitter = UserSerializer(
        fields=("username",),
        read_only=True,
    )

    class Meta:
        model = RequestMetadata
        exclude = ("id",)
