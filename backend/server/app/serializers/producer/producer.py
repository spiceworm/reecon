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
    description = serializers.CharField(
        read_only=True,
    )
    name = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = ProducerCategory
        exclude = ("id",)


class ProducerSerializer(serializers.Serializer):
    context_window = serializers.IntegerField(
        read_only=True,
    )
    category = ProducedCategorySerializer(
        read_only=True,
    )
    description = serializers.CharField(
        read_only=True,
    )
    name = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = Producer
        exclude = ("id",)
