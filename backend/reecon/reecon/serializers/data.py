from rest_framework import serializers

from .user import UserSerializer
from ..models import (
    LLM,
    LlmProvider,
    ProducedBinary,
    ProducedFloat,
    ProducedInteger,
    ProducedText,
    ProducedTextList,
)


__all__ = (
    "LlmSerializer",
    "LlmProviderSerializer",
    "ProducedBinarySerializer",
    "ProducedFloatSerializer",
    "ProducedIntegerSerializer",
    "ProducedTextSerializer",
    "ProducedTextListSerializer",
)


class LlmSerializer(serializers.ModelSerializer):
    class Meta:
        model = LLM
        exclude = (
            "created",
            "id",
        )


class LlmProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = LlmProvider
        exclude = (
            "created",
            "id",
        )


class ProducedDataBaseSerializer(serializers.ModelSerializer):
    contributor = UserSerializer(
        fields=("username",),
        read_only=True,
    )
    llm = LlmSerializer(
        read_only=True,
    )


class ProducedBinarySerializer(ProducedDataBaseSerializer):
    class Meta:
        model = ProducedBinary
        exclude = (
            "created",
            "id",
        )


class ProducedFloatSerializer(ProducedDataBaseSerializer):
    class Meta:
        model = ProducedFloat
        exclude = (
            "created",
            "id",
        )


class ProducedIntegerSerializer(ProducedDataBaseSerializer):
    class Meta:
        model = ProducedInteger
        exclude = (
            "created",
            "id",
        )


class ProducedTextSerializer(ProducedDataBaseSerializer):
    class Meta:
        model = ProducedText
        exclude = (
            "created",
            "id",
        )


class ProducedTextListSerializer(ProducedDataBaseSerializer):
    class Meta:
        model = ProducedTextList
        exclude = (
            "created",
            "id",
        )
