from django.db import models


__all__ = ("StatusMessage",)


class StatusMessage(models.Model):
    active = models.BooleanField(
        default=False,
        null=False,
        help_text=(
            "If `True`, the `StatusMessage` will be included in the /api/v1/messages/ response. Set "
            "`active_is_computed` to `True` if this field is dynamically set in signals.py."
        ),
    )
    active_is_computed = models.BooleanField(
        default=False,
        null=False,
        help_text="Set this to `True` if `StatusMessage.active` is dynamically set in signals.py.",
    )
    category = models.CharField(
        choices=[
            ("danger", "danger"),
            ("info", "info"),
            ("warning", "warning"),
        ],
        null=False,
        help_text="Corresponds to how the message is rendered in the extension Status tab.",
    )
    message = models.TextField(
        help_text="Information that should be conveyed to users in the extension Status tab.",
    )
    name = models.CharField(null=False, unique=True, help_text="Descriptive name for the `StatusMessage`.")
    source = models.CharField(
        default="api",
        null=False,
        help_text="Describes where the `StatusMessage` originated from ('api' / 'extension').",
    )