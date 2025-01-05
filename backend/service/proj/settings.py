from pathlib import Path

from reecon import settings as reecon_settings


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = reecon_settings.SECRET_KEY
DEBUG = reecon_settings.DEBUG

WSGI_APPLICATION = "proj.wsgi.application"

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django_rq",
    "reecon",
    "app",
]

CACHES = reecon_settings.CACHES
DATABASES = reecon_settings.DATABASES

RQ = reecon_settings.RQ
RQ_QUEUES = reecon_settings.RQ_QUEUES

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "%(levelname)s %(message)s"},
        "verbose": {"format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "rq-file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/var/log/supervisor/rq-scheduler/scheduler.log",
            "maxBytes": 15728640,  # 1024 * 1024 * 15B = 15MB
            "backupCount": 10,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "asyncio": {
            # suppress "Using selector: EpollSelector" when using `manage.py shell`
            "level": "WARNING",
        },
        "django": {
            "handlers": ["console"],
            "level": reecon_settings.LOG_LEVEL,
            "propagate": False,
        },
        "rq.scheduler": {
            "handlers": ["rq-file"],
            "level": reecon_settings.LOG_LEVEL,
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": reecon_settings.LOG_LEVEL,
    },
}

LANGUAGE_CODE = reecon_settings.LANGUAGE_CODE
TIME_ZONE = reecon_settings.TIME_ZONE
USE_I18N = reecon_settings.USE_I18N
USE_TZ = reecon_settings.USE_TZ
DEFAULT_AUTO_FIELD = reecon_settings.DEFAULT_AUTO_FIELD

CONSTANCE_BACKEND = reecon_settings.CONSTANCE_BACKEND
CONSTANCE_REDIS_CONNECTION = reecon_settings.CONSTANCE_REDIS_CONNECTION
CONSTANCE_ADDITIONAL_FIELDS = reecon_settings.CONSTANCE_ADDITIONAL_FIELDS
CONSTANCE_CONFIG = reecon_settings.CONSTANCE_CONFIG
