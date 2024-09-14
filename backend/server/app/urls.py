from django.contrib import admin
from django.urls import include, path

from . import api_urls


admin.autodiscover()


urlpatterns = [
    path("admin/docs/", include("django.contrib.admindocs.urls")),
    path("admin/", admin.site.urls),
    path("api/", include(api_urls)),
    path("django-rq/", include("django_rq.urls")),
]
