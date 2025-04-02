from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from reecon.models import (
    AppUser,
    Profile,
)


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False


class UserAdmin(BaseUserAdmin):
    inlines = [ProfileInline]


admin.site.register(AppUser, UserAdmin)
