from django.contrib.auth.models import User
from rest_framework import serializers


__all__ = (
    "SignupRequestSerializer",
    "SignupResponseSerializer",
)


class SignupRequestSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)


class SignupResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ("email", "id", "password")
