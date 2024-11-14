from django.db.models import ForeignObjectRel
from django.contrib import admin

from ..models import (
    IgnoredRedditor,
    Producer,
    ProducerCategory,
    Redditor,
    StatusMessage,
    Thread,
    UnprocessableRedditor,
    UnprocessableThread,
)

__all__ = (
    "IgnoredRedditorAdmin",
    "ProducerAdmin",
    "ProducerCategoryAdmin",
    "RedditorAdmin",
    "StatusMessageAdmin",
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


@admin.register(StatusMessage)
class StatusMessageAdmin(admin.ModelAdmin):
    list_display = get_list_display(StatusMessage)

    def get_readonly_fields(self, request, obj: StatusMessage | None = None):
        # Do not show the "active_is_computed" checkbox in the admin UI. This field is only set for hardcoded
        # `StatusMessages` objects when they are created if `StatusMessage.active` is dynamically set in signals.py.
        readonly_fields = ["active_is_computed"]

        # Do not show the "active" checkbox in the admin UI for `StatusMessage` objects if the `active` field is
        # dynamically set in signals.py by by signals triggered by Constance config changes.
        if obj and obj.active_is_computed:
            readonly_fields.append("active")

        return readonly_fields


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = get_list_display(Thread)


@admin.register(UnprocessableRedditor)
class UnprocessableRedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableRedditor)


@admin.register(UnprocessableThread)
class UnprocessableThreadAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableThread)
