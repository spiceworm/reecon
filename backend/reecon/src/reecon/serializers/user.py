from django.contrib.auth import get_user_model

from .util import DynamicFieldsModelSerializer


__all__ = ("UserSerializer",)


class UserSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = get_user_model()
        exclude = ("groups", "email", "first_name", "id", "last_login", "last_name", "password", "user_permissions")
