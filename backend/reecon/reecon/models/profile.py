from django.conf import settings
from django.core import signing
from django.db import models


__all__ = ("Profile",)


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reddit_username = models.CharField(blank=True, null=True, unique=True)

    def __str__(self):
        return f"{self.__class__.__name__}(user={self.user.username}, reddit_username={self.reddit_username}"

    @property
    def signed_username(self) -> str:
        """
        Append a signature derived from the app's SECRET_KEY to the user's username. This value is included in the body
        of the direct message sent to reecon-admin when linking their reddit username with their reecon account. A
        signature is included to ensure that the end user did not modify the value of the DM body.
        """
        signer = signing.Signer()
        return signer.sign(self.user.username)

    def verify_signed_username(self, signed_username: str) -> bool:
        signer = signing.Signer()
        try:
            unsigned = signer.unsign(signed_username)
        except signing.BadSignature:
            return False
        else:
            return unsigned == self.user.username
