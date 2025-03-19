from rest_framework import serializers

from reecon.models import (
    Producer,
    ProducerCategory,
)


__all__ = (
    "ProducerSerializer",
    "ProducedCategorySerializer",
)


class ProducedCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProducerCategory
        exclude = (
            "created",
            "id",
        )


class ProducerSerializer(serializers.ModelSerializer):
    category = ProducedCategorySerializer(
        read_only=True,
    )

    class Meta:
        model = Producer
        exclude = (
            "created",
            "id",
        )
