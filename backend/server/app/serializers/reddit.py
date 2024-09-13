from rest_framework import serializers

from ..models import (
    Redditor,
    Thread,
)


__all__ = (
    "RedditorSerializer",
    "RedditorUsernameSerializer",
    "ThreadSerializer",
    "ThreadUrlPathsSerializer",
)


class StringListField(serializers.ListField):
    value = serializers.CharField()


class RedditorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Redditor
        exclude = ("id",)


class RedditorUsernameSerializer(serializers.Serializer):
    usernames = StringListField()


class ThreadSerializer(serializers.ModelSerializer):
    path = serializers.ReadOnlyField()

    class Meta:
        model = Thread
        exclude = ("id",)


class ThreadUrlPathsSerializer(serializers.Serializer):
    paths = StringListField()
