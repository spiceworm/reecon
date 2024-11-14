from rest_framework import serializers

from reecon.models import (
    ProducedBinary,
    ProducedFloat,
    ProducedInteger,
    ProducedText,
    ProducedTextList,
)

from .producer import (
    ContributorSerializer,
    ProducerSerializer,
)


class ProducedBinarySerializer(serializers.Serializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    created = serializers.DateTimeField(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )
    # value = ?

    class Meta:
        model = ProducedBinary
        exclude = ("id",)


class ProducedFloatSerializer(serializers.Serializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    created = serializers.DateTimeField(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )
    value = serializers.FloatField(
        read_only=True,
    )

    class Meta:
        model = ProducedFloat
        exclude = ("id",)


class ProducedIntegerSerializer(serializers.Serializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    created = serializers.DateTimeField(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )
    value = serializers.IntegerField(
        read_only=True,
    )

    class Meta:
        model = ProducedInteger
        exclude = ("id",)


class ProducedTextSerializer(serializers.Serializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    created = serializers.DateTimeField(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )
    value = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = ProducedText
        exclude = ("id",)


class ProducedTextListSerializer(serializers.Serializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    created = serializers.DateTimeField(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )
    value = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )

    class Meta:
        model = ProducedTextList
        exclude = ("id",)
