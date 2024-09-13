from django.urls import include, path

from . import api_urls


urlpatterns = [
    path("api/", include(api_urls)),
    path("django-rq/", include("django_rq.urls")),
]
