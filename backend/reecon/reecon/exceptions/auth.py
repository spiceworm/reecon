from rest_framework import status
from rest_framework.exceptions import APIException


__all__ = ("UserSignupConflictException",)


class UserSignupConflictException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "The provided username is already in use."
