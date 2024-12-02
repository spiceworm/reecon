from django.contrib.auth.models import User
from rest_framework import serializers

__all__ = ("UserSerializer",)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ("groups", "email", "first_name", "id", "last_name", "password", "user_permissions")
