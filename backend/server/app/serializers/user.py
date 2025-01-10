from django.contrib.auth import get_user_model
from rest_framework import serializers

__all__ = ("UserSerializer",)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        exclude = ("groups", "email", "first_name", "last_name", "password", "user_permissions")
