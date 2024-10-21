from django.contrib.auth.models import User
from rest_framework import serializers


__all__ = (
    "SignupSerializer",
    "UserSerializer",
)


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ("email", "id", "password")
