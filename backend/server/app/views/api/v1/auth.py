from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response

from ....exceptions import UserSignupConflictException
from ....serializers import (
    SignupRequestSerializer,
    SignupResponseSerializer,
)


__all__ = ("SignupView",)


@extend_schema(responses=SignupResponseSerializer)
class SignupView(CreateAPIView):
    authentication_classes = ()
    queryset = get_user_model().objects.all()
    serializer_class = SignupRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.data

        user_model = get_user_model()

        if user_model.objects.filter(username=data["username"]).exists():
            raise UserSignupConflictException()

        user = user_model.objects.create_user(
            username=data["username"],
            password=data["password"],
        )

        response_serializer = SignupResponseSerializer(instance=user)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
