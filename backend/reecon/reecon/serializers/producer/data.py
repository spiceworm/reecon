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


class ProducedBinarySerializer(serializers.ModelSerializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedBinary
        fields = "__all__"


class ProducedFloatSerializer(serializers.ModelSerializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedFloat
        fields = "__all__"


class ProducedIntegerSerializer(serializers.ModelSerializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedInteger
        fields = "__all__"


class ProducedTextSerializer(serializers.ModelSerializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedText
        fields = "__all__"


class ProducedTextListSerializer(serializers.ModelSerializer):
    contributor = ContributorSerializer(
        read_only=True,
    )
    producer = ProducerSerializer(
        read_only=True,
    )

    class Meta:
        model = ProducedTextList
        fields = "__all__"
