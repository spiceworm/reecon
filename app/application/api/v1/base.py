from . import api_router


__all__ = ("_status",)


@api_router.get("/status", summary="Check application health status")
async def _status() -> dict:
    """
    Returns a response code of 200.
    """
    return {}
