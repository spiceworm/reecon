from django.contrib.auth.models import User
from rest_framework import serializers

from reecon.models import (
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


class ProducedCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProducerCategory
        fields = "__all__"


class ProducerSerializer(serializers.ModelSerializer):
    category = ProducedCategorySerializer(
        read_only=True,
    )

    class Meta:
        model = Producer
        fields = "__all__"
