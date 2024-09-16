from django.db.models import ForeignObjectRel
from django.contrib import admin

from ..models import (
    Creator,
    IgnoredRedditor,
    LLM,
    Redditor,
    RedditorStats,
    Thread,
    ThreadStats,
    UnprocessableThread,
    UnprocessableRedditor,
)

__all__ = (
    "CreatorAdmin",
    "IgnoredRedditorAdmin",
    "LLMAdmin",
    "RedditorAdmin",
    "RedditorStatsAdmin",
    "ThreadAdmin",
    "UnprocessableRedditorAdmin",
    "UnprocessableThreadAdmin",
)


def get_list_display(cls):
    """
    Django admin will throw an error if you try to include certain relationship fields in the attributes
    table. Exclude attributes that are `ManyToOneRel` fields.
    """
    return [field.name for field in cls._meta.get_fields() if not isinstance(field, ForeignObjectRel)]


@admin.register(Creator)
class CreatorAdmin(admin.ModelAdmin):
    list_display = get_list_display(Creator)


@admin.register(IgnoredRedditor)
class IgnoredRedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(IgnoredRedditor)


@admin.register(LLM)
class LLMAdmin(admin.ModelAdmin):
    list_display = get_list_display(LLM)


@admin.register(Redditor)
class RedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(Redditor)


@admin.register(RedditorStats)
class RedditorStatsAdmin(admin.ModelAdmin):
    list_display = get_list_display(RedditorStats)


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = get_list_display(Thread)


@admin.register(ThreadStats)
class ThreadStatsAdmin(admin.ModelAdmin):
    list_display = get_list_display(ThreadStats)


@admin.register(UnprocessableRedditor)
class UnprocessableRedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableRedditor)


@admin.register(UnprocessableThread)
class UnprocessableThreadAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableThread)
