import collections
from datetime import timedelta
import importlib.metadata
from pathlib import Path

import decouple

from reecon import settings as reecon_settings


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = reecon_settings.SECRET_KEY
DEBUG = reecon_settings.DEBUG

ROOT_URLCONF = "proj.urls"
WSGI_APPLICATION = "proj.wsgi.application"

ALLOWED_HOSTS = [".reecon.xyz"] if reecon_settings.PRODUCTION else ["*"]
CSRF_TRUSTED_ORIGINS = ["https://reecon.xyz"] if reecon_settings.PRODUCTION else ["http://127.0.0.1:8888"]
CORS_ALLOW_ALL_ORIGINS = True

AUTH_USER_MODEL = reecon_settings.AUTH_USER_MODEL

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.admindocs",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "drf_spectacular_sidecar",
    "django_rq",
    "constance",
    "reecon",
    "app",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

CACHES = reecon_settings.CACHES
DATABASES = reecon_settings.DATABASES

RQ = reecon_settings.RQ
RQ_QUEUES = reecon_settings.RQ_QUEUES
RQ_SHOW_ADMIN_LINK = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
    "NON_FIELD_ERRORS_KEY": "errors",
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

ACCESS_TOKEN_LIFETIME_UNIT = decouple.config("ACCESS_TOKEN_LIFETIME_UNIT", default="minutes")
ACCESS_TOKEN_LIFETIME_VALUE = decouple.config("ACCESS_TOKEN_LIFETIME_VALUE", cast=int, default=15)
ACCESS_TOKEN_LIFETIME_TIMEDELTA = timedelta(**{ACCESS_TOKEN_LIFETIME_UNIT: ACCESS_TOKEN_LIFETIME_VALUE})
REFRESH_TOKEN_LIFETIME_UNIT = decouple.config("REFRESH_TOKEN_LIFETIME_UNIT", default="days")
REFRESH_TOKEN_LIFETIME_VALUE = decouple.config("REFRESH_TOKEN_LIFETIME_VALUE", cast=int, default=30)
REFRESH_TOKEN_LIFETIME_TIMEDELTA = timedelta(**{REFRESH_TOKEN_LIFETIME_UNIT: REFRESH_TOKEN_LIFETIME_VALUE})

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": ACCESS_TOKEN_LIFETIME_TIMEDELTA,
    "REFRESH_TOKEN_LIFETIME": REFRESH_TOKEN_LIFETIME_TIMEDELTA,
}

SPECTACULAR_SETTINGS = {
    "TITLE": decouple.config("APP_NAME"),
    "DESCRIPTION": decouple.config("DESCRIPTION", default=decouple.config("APP_NAME")),
    "VERSION": importlib.metadata.version("reecon"),
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_DIST": "SIDECAR",
    "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
    "REDOC_DIST": "SIDECAR",
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "%(levelname)s %(message)s"},
        "verbose": {"format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"},
    },
    "handlers": {
        "app-file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/var/log/supervisor/gunicorn/app.log",
            "maxBytes": 15728640,  # 1024 * 1024 * 15B = 15MB
            "backupCount": 10,
            "formatter": "verbose",
        },
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "db-file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/var/log/supervisor/gunicorn/db.log",
            "maxBytes": 15728640,  # 1024 * 1024 * 15B = 15MB
            "backupCount": 10,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "app": {
            "handlers": ["app-file"],
            "level": reecon_settings.LOG_LEVEL,
        },
        "asyncio": {
            # suppress "Using selector: EpollSelector" when using `manage.py shell`
            "level": "WARNING",
        },
        "django": {
            "handlers": ["console"],
            "level": reecon_settings.LOG_LEVEL,
            "propagate": False,
        },
        "django.template": {
            # suppress "django.template.base.VariableDoesNotExist" errors thrown by admin pages
            "level": "WARNING",
        },
        "django.db.backends": {
            "handlers": ["db-file"],
            "level": reecon_settings.LOG_LEVEL,
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": reecon_settings.LOG_LEVEL,
    },
}

for handler_config in LOGGING["handlers"].values():
    if "filename" in handler_config:
        Path(handler_config["filename"]).parent.mkdir(parents=True, exist_ok=True)

LANGUAGE_CODE = reecon_settings.LANGUAGE_CODE
TIME_ZONE = reecon_settings.TIME_ZONE
USE_I18N = reecon_settings.USE_I18N
USE_TZ = reecon_settings.USE_TZ
DEFAULT_AUTO_FIELD = reecon_settings.DEFAULT_AUTO_FIELD

STATIC_URL = "/static/"
STATIC_ROOT = "/static/"

CONSTANCE_BACKEND = reecon_settings.CONSTANCE_BACKEND
CONSTANCE_REDIS_CONNECTION = reecon_settings.CONSTANCE_REDIS_CONNECTION
CONSTANCE_ADDITIONAL_FIELDS = reecon_settings.CONSTANCE_ADDITIONAL_FIELDS
CONSTANCE_CONFIG = reecon_settings.CONSTANCE_CONFIG

# The DEFAULT_LLM_PROVIDER_SETTINGS should only be used when running management commands.
# Users provide their own API key in the extension which is then sent to the backend API when processing occurs.
DEFAULT_LLM_PROVIDERS_SETTINGS = {
    "openai": {
        "name": "openai",
        "api_key": decouple.config("DEFAULT_OPENAI_API_KEY"),
    }
}

REDDIT_API_CLIENT_ID = decouple.config("REDDIT_API_CLIENT_ID")
REDDIT_API_CLIENT_SECRET = decouple.config("REDDIT_API_CLIENT_SECRET")
REDDIT_API_RATELIMIT_SECONDS = decouple.config("REDDIT_API_RATELIMIT_SECONDS", cast=int, default=300)
REDDIT_API_USER_AGENT = decouple.config("REDDIT_API_USER_AGENT")
