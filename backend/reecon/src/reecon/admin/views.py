from django.db.models import ForeignObjectRel
from django.contrib import admin

from ..models import (
    IgnoredRedditor,
    LLM,
    LlmProvider,
    Profile,
    Redditor,
    RedditorContextQuery,
    StatusMessage,
    Thread,
    ThreadContextQuery,
    UnprocessableRedditor,
    UnprocessableRedditorContextQuery,
    UnprocessableThread,
    UnprocessableThreadContextQuery,
)

__all__ = (
    "IgnoredRedditorAdmin",
    "LlmAdmin",
    "LlmProviderAdmin",
    "RedditorAdmin",
    "RedditorContextQueryAdmin",
    "StatusMessageAdmin",
    "ThreadAdmin",
    "ThreadContextQueryAdmin",
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


@admin.register(LLM)
class LlmAdmin(admin.ModelAdmin):
    list_display = get_list_display(LLM)


@admin.register(LlmProvider)
class LlmProviderAdmin(admin.ModelAdmin):
    list_display = get_list_display(LlmProvider)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = get_list_display(Profile)


@admin.register(Redditor)
class RedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(Redditor)


@admin.register(RedditorContextQuery)
class RedditorContextQueryAdmin(admin.ModelAdmin):
    list_display = get_list_display(RedditorContextQuery)


@admin.register(StatusMessage)
class StatusMessageAdmin(admin.ModelAdmin):
    list_display = get_list_display(StatusMessage)

    def get_readonly_fields(self, request, obj: StatusMessage | None = None):
        # Do not show the "active_is_computed" checkbox in the admin UI. This field is only set for hardcoded
        # `StatusMessages` objects when they are created if `StatusMessage.active` is dynamically set in signals.py.
        readonly_fields = ["active_is_computed"]

        # Do not show the "active" checkbox in the admin UI for `StatusMessage` objects if the `active` field is
        # dynamically set in signals.py by signals triggered by Constance config changes.
        if obj and obj.active_is_computed:
            readonly_fields.append("active")

        return readonly_fields


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = get_list_display(Thread)


@admin.register(ThreadContextQuery)
class ThreadContextQueryAdmin(admin.ModelAdmin):
    list_display = get_list_display(ThreadContextQuery)


@admin.register(UnprocessableRedditor)
class UnprocessableRedditorAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableRedditor)


@admin.register(UnprocessableRedditorContextQuery)
class UnprocessableRedditorContextQueryAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableRedditorContextQuery)


@admin.register(UnprocessableThread)
class UnprocessableThreadAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableThread)


@admin.register(UnprocessableThreadContextQuery)
class UnprocessableThreadContextQueryAdmin(admin.ModelAdmin):
    list_display = get_list_display(UnprocessableThreadContextQuery)
