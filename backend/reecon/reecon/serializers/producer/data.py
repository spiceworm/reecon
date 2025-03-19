from rest_framework import serializers

from reecon.models import (
    ProducedBinary,
    ProducedFloat,
    ProducedInteger,
    ProducedText,
    ProducedTextList,
)

from .producer import ProducerSerializer
from ..user import UserSerializer


class ProducedBinarySerializer(serializers.ModelSerializer):
    contributor = UserSerializer(
        fields=("username",),
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedBinary
        exclude = ("id",)


class ProducedFloatSerializer(serializers.ModelSerializer):
    contributor = UserSerializer(
        fields=("username",),
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedFloat
        exclude = ("id",)


class ProducedIntegerSerializer(serializers.ModelSerializer):
    contributor = UserSerializer(
        fields=("username",),
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedInteger
        exclude = ("id",)


class ProducedTextSerializer(serializers.ModelSerializer):
    contributor = UserSerializer(
        fields=("username",),
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedText
        exclude = ("id",)


class ProducedTextListSerializer(serializers.ModelSerializer):
    contributor = UserSerializer(
        fields=("username",),
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedTextList
        exclude = ("id",)
