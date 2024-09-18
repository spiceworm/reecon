from django.contrib.auth.models import User
from django.db.models import Q
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
)
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response

from ....exceptions import UserSignupConflictException
from ....serializers import (
    SignupSerializer,
    UserSerializer,
)


__all__ = ("SignupView",)


def response_schema(**kwargs):
    def decorator(view):
        extend_schema_view(
            post=extend_schema(responses={201: kwargs["serializer"]}),
        )(view)
        return view

    return decorator


@response_schema(serializer=UserSerializer)
class SignupView(CreateAPIView):
    authentication_classes = ()
    queryset = User.objects.all()
    serializer_class = SignupSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.data

        if User.objects.filter(Q(username=data["username"]) | Q(email=data["email"])).exists():
            # TODO create a table containing reserved usernames that people cannot use and check for those here
            # e.g. admin, reecon-admin administrator, root, etc
            raise UserSignupConflictException()

        # TODO: Send verification email
        user = User.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"],
        )
        response_serializer = UserSerializer(instance=user)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
