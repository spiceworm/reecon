from django.contrib.auth import get_user_model
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
        model = get_user_model()
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
