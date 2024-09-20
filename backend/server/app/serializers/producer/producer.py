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
    context_window = serializers.IntegerField()
    category = ProducedCategorySerializer()
    description = serializers.CharField()
    name = serializers.CharField()

    class Meta:
        model = Producer
        exclude = ("id",)
