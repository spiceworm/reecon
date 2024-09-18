from django.contrib.auth.models import User
from rest_framework import serializers

from ...models import (
    Producer,
    ProducerCategory,
)


__all__ = (
    "ContributorSerializer",
    "ProducerSerializer",
    "ProducedCategorySerializer",
)


class ContributorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username",)


class ProducedCategorySerializer(serializers.Serializer):
    description = serializers.CharField()
    name = serializers.CharField()

    class Meta:
        model = ProducerCategory
        exclude = ("id",)


class ProducerSerializer(serializers.Serializer):
    category = ProducedCategorySerializer()
    description = serializers.CharField()
    max_input_characters = serializers.IntegerField()
    name = serializers.CharField()

    class Meta:
        model = Producer
        exclude = ("id",)
