from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response

from ......serializers import (
    ValidateProducerSettingsRequestSerializer,
    ValidateProducerSettingsResponseSerializer,
)
from ......util import (
    schema,
    validate,
)


__all__ = ("ValidateProducerSettingsView",)


@schema.response_schema(serializer=ValidateProducerSettingsResponseSerializer)
class ValidateProducerSettingsView(CreateAPIView):
    serializer_class = ValidateProducerSettingsRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.data
        validated_settings = validate.producer_settings(data["producer_name"], data["api_key"])
        response_serializer = ValidateProducerSettingsResponseSerializer(data={'settings': validated_settings})
        response_serializer.is_valid(raise_exception=True)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
