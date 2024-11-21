from django.urls import (
    include,
    path,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views.api import v1


router = DefaultRouter()
router.register(r"producers/llm", v1.LlmProducerViewSet, basename="producer-llm")
router.register(r"status/messages", v1.StatusMessagesViewSet, basename="status-messages")

router.register(
    r"reddit/redditor/context-query", v1.RedditorContextQueryViewSet, basename="reddit-redditor-context-query"
)
router.register(r"reddit/thread/context-query", v1.ThreadContextQueryViewSet, basename="reddit-thread-context-query")

router.register(r"reddit/redditor/data", v1.RedditorsDataViewSet, basename="reddit-redditor-data")
router.register(r"reddit/thread/data", v1.ThreadsDataViewSet, basename="reddit-thread-data")


v1_endpoints = [
    path("", include(router.urls)),
    path("status/", v1.StatusView.as_view(), name="status"),
]

v1_auth = [
    path("signup/", v1.SignupView.as_view(), name="signup"),
    path("token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]

v1_docs = [
    path("", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

urlpatterns = [
    path("v1/", include(v1_endpoints)),
    path("v1/auth/", include(v1_auth)),
    path("v1/docs/", include(v1_docs)),
]
