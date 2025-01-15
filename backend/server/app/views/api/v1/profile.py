import logging

from rest_framework.generics import RetrieveAPIView

from reecon.models import Profile
from reecon.serializers import ProfileSerializer


__all__ = ("ProfileView",)


log = logging.getLogger("app.views.api.v1.profile")


class ProfileView(RetrieveAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        return Profile.objects.get(user=self.request.user)
