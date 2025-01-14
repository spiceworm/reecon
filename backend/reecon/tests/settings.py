from pathlib import Path

from reecon import settings as reecon_settings


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = reecon_settings.SECRET_KEY
DEBUG = reecon_settings.DEBUG

AUTH_USER_MODEL = reecon_settings.AUTH_USER_MODEL

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "reecon",
]

CACHES = reecon_settings.CACHES
DATABASES = reecon_settings.DATABASES

RQ = reecon_settings.RQ
RQ_QUEUES = reecon_settings.RQ_QUEUES

LANGUAGE_CODE = reecon_settings.LANGUAGE_CODE
TIME_ZONE = reecon_settings.TIME_ZONE
USE_I18N = reecon_settings.USE_I18N
USE_TZ = reecon_settings.USE_TZ
DEFAULT_AUTO_FIELD = reecon_settings.DEFAULT_AUTO_FIELD

CONSTANCE_BACKEND = reecon_settings.CONSTANCE_BACKEND
CONSTANCE_REDIS_CONNECTION = reecon_settings.CONSTANCE_REDIS_CONNECTION
CONSTANCE_ADDITIONAL_FIELDS = reecon_settings.CONSTANCE_ADDITIONAL_FIELDS
CONSTANCE_CONFIG = reecon_settings.CONSTANCE_CONFIG
