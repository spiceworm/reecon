from pathlib import Path

import decouple


BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = decouple.config("SECRET_KEY")

DEBUG = decouple.config("DEBUG", cast=bool, default=False)
PRODUCTION = decouple.config("PRODUCTION", cast=bool, default=False)

WSGI_APPLICATION = "proj.wsgi.application"

LOG_LEVEL = decouple.config(
    "LOG_LEVEL",
    default="DEBUG" if DEBUG else "INFO",
    cast=decouple.Choices(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]),
)

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django_rq",
    "reecon.apps.ReeconConfig",
    "app",
]

REDIS_HOST = decouple.config("REDIS_HOST")
REDIS_PASSWORD = decouple.config("REDIS_PASSWORD", default="")
REDIS_PORT = decouple.config("REDIS_PORT", cast=int, default=6379)
REDIS_SSL = decouple.config("REDIS_SSL", cast=bool, default=False)
REDIS_USERNAME = decouple.config("REDIS_USERNAME", default="")
REDIS_URL = f"redis{'s' if REDIS_SSL else ''}://{REDIS_USERNAME}:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/0"

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "DEFAULT_TIMEOUT": 360,
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"ssl_cert_reqs": None} if REDIS_SSL else {},
        },
    }
}

RQ = {
    "DEFAULT_RESULT_TTL": 5000,
}

RQ_QUEUES = {
    "default": {
        "USE_REDIS_CACHE": "default",
    },
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "ATOMIC_REQUESTS": True,
        "CONN_MAX_AGE": 30,
        "HOST": decouple.config("POSTGRES_HOST"),
        "NAME": decouple.config("POSTGRES_DB"),
        "PASSWORD": decouple.config("POSTGRES_PASSWORD"),
        "PORT": decouple.config("POSTGRES_PORT"),
        "USER": decouple.config("POSTGRES_USER"),
        "OPTIONS": {
            "sslmode": decouple.config("POSTGRES_SSL"),
        },
    }
}

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
            "filename": "/var/log/supervisor/rq-worker/worker.log",
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
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "rq.worker": {
            "handlers": ["rq-file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
}

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
