from rest_framework import serializers


from .producer import (
    ContributorSerializer,
    ProducerSerializer,
)
from ...models import (
    ProducedBinary,
    ProducedFloat,
    ProducedInteger,
    ProducedText,
)


class ProducedBinarySerializer(serializers.Serializer):
    contributor = ContributorSerializer()
    created = serializers.DateTimeField()
    producer = ProducerSerializer()
    # value = ?

    class Meta:
        model = ProducedBinary
        exclude = ("id",)


class ProducedFloatSerializer(serializers.Serializer):
    contributor = ContributorSerializer()
    created = serializers.DateTimeField()
    producer = ProducerSerializer()
    value = serializers.FloatField()

    class Meta:
        model = ProducedFloat
        exclude = ("id",)


class ProducedIntegerSerializer(serializers.Serializer):
    contributor = ContributorSerializer()
    created = serializers.DateTimeField()
    producer = ProducerSerializer()
    value = serializers.IntegerField()

    class Meta:
        model = ProducedInteger
        exclude = ("id",)


class ProducedTextSerializer(serializers.Serializer):
    contributor = ContributorSerializer()
    created = serializers.DateTimeField()
    producer = ProducerSerializer()
    value = serializers.CharField()

    class Meta:
        model = ProducedText
        exclude = ("id",)
