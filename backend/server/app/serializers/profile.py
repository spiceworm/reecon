from rest_framework import serializers

from reecon.models import Profile

from .user import UserSerializer


__all__ = ("ProfileSerializer",)


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(
        read_only=True,
    )

    class Meta:
        model = Profile
        fields = "__all__"
