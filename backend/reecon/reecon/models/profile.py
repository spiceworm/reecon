from django.contrib.auth.models import User
from django.db import models


__all__ = ("Profile",)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    reddit_username = models.CharField(blank=True, null=True, unique=True)

    def __str__(self):
        return f"{self.__class__.__name__}(user={self.user.username}, reddit_username={self.reddit_username}"
