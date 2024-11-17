from rest_framework.mixins import ListModelMixin
from rest_framework.viewsets import GenericViewSet


__all__ = ("ReadOnlyListModelViewSet",)


class ReadOnlyListModelViewSet(ListModelMixin, GenericViewSet):
    """
    A viewset that provides a default `list()` action.
    """
    pass
