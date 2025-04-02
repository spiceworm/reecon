from rest_framework import serializers

from .user import UserSerializer
from ..models import Profile


__all__ = ("ProfileSerializer",)


class ProfileSerializer(serializers.ModelSerializer):
    signed_username = serializers.CharField(
        read_only=True,
    )
    user = UserSerializer(
        read_only=True,
    )

    class Meta:
        model = Profile
        exclude = ("id",)
