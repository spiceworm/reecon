from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
)


def response_schema(**kwargs):
    def decorator(view):
        extend_schema_view(
            create=extend_schema(responses={201: kwargs["serializer"]}),
        )(view)
        return view

    return decorator
