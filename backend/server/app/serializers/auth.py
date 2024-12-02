from rest_framework import serializers

from .user import UserSerializer


__all__ = (
    "SignupRequestSerializer",
    "SignupResponseSerializer",
)


class SignupRequestSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)


SignupResponseSerializer = UserSerializer
