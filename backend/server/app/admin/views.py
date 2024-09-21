from django.db.models import ForeignObjectRel
from django.contrib import admin

from ..models import (
    IgnoredRedditor,
    Producer,
    ProducerCategory,
    Redditor,
    Thread,
    UnprocessableRedditor,
    UnprocessableThread,
)

__all__ = (
    "IgnoredRedditorAdmin",
    "ProducerAdmin",
    "ProducerCategoryAdmin",
    "RedditorAdmin",
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


@admin.register(IgnoredRedditor)
class IgnoredRedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(IgnoredRedditor)


@admin.register(Producer)
class ProducerAdmin(admin.ModelAdmin):
    list_display = get_list_display(Producer)


@admin.register(ProducerCategory)
class ProducerCategoryAdmin(admin.ModelAdmin):
    list_display = get_list_display(ProducerCategory)


@admin.register(Redditor)
class RedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(Redditor)


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = get_list_display(Thread)


@admin.register(UnprocessableRedditor)
class UnprocessableRedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableRedditor)


@admin.register(UnprocessableThread)
class UnprocessableThreadAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableThread)
