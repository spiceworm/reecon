from django.contrib import admin

from ..models import (
    IgnoredRedditor,
    Redditor,
    Thread,
    UnprocessableThread,
    UnprocessableRedditor,
)

__all__ = (
    "IgnoredRedditorAdmin",
    "RedditorAdmin",
    "ThreadAdmin",
    "UnprocessableThreadAdmin",
    "UnprocessableRedditorAdmin",
)


@admin.register(IgnoredRedditor)
class IgnoredRedditorAdmin(admin.ModelAdmin):
    list_display = [field.name for field in IgnoredRedditor._meta.get_fields()]


@admin.register(Redditor)
class RedditorAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Redditor._meta.get_fields()]


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Thread._meta.get_fields()]


@admin.register(UnprocessableThread)
class UnprocessableThreadAdmin(admin.ModelAdmin):
    list_display = [field.name for field in UnprocessableThread._meta.get_fields()]


@admin.register(UnprocessableRedditor)
class UnprocessableRedditorAdmin(admin.ModelAdmin):
    list_display = [field.name for field in UnprocessableRedditor._meta.get_fields()]
