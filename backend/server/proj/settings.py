"""
Django settings for app project.

Generated by 'django-admin startproject' using Django 5.1.1.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

import collections
from datetime import timedelta
from pathlib import Path

import decouple
import openai
import praw


BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = decouple.config("SECRET_KEY")

DEBUG = decouple.config("DEBUG", cast=bool, default=False)
PRODUCTION = decouple.config("PRODUCTION", cast=bool, default=False)

ROOT_URLCONF = "proj.urls"
WSGI_APPLICATION = "proj.wsgi.application"

LOG_LEVEL = decouple.config(
    "LOG_LEVEL",
    default="DEBUG" if DEBUG else "INFO",
    cast=decouple.Choices(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]),
)

ALLOWED_HOSTS = [".reecon.xyz"] if PRODUCTION else ["*"]
CSRF_TRUSTED_ORIGINS = ["https://reecon.xyz"] if PRODUCTION else ["http://127.0.0.1:8888"]
CORS_ALLOW_ALL_ORIGINS = True

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


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

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

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
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
    "VERSION": decouple.config("VERSION"),
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
        "rq-file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/var/log/supervisor/rq-worker/worker.log",
            "maxBytes": 15728640,  # 1024 * 1024 * 15B = 15MB
            "backupCount": 10,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "app": {
            "handlers": ["app-file"],
            "level": LOG_LEVEL,
        },
        "asyncio": {
            # suppress "Using selector: EpollSelector" when using `manage.py shell`
            "level": "WARNING",
        },
        "django": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["db-file"],
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

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = "/static/"
STATIC_ROOT = "/static/"

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


def get_llm_choices():
    # Importing a model cannot happen at the top of the file.
    from app.models import Producer

    return ((name, name) for name in Producer.objects.filter(category__name="LLM").values_list("name", flat=True))


def get_nlp_choices():
    # Importing a model cannot happen at the top of the file.
    from app.models import Producer

    return ((name, name) for name in Producer.objects.filter(category__name="NLP").values_list("name", flat=True))


CONSTANCE_BACKEND = "constance.backends.redisd.RedisBackend"
CONSTANCE_REDIS_CONNECTION = REDIS_URL
CONSTANCE_ADDITIONAL_FIELDS = {
    "checkbox": [
        "django.forms.fields.BooleanField",
        {
            "required": False,
        },
    ],
    "llm_select": [
        "django.forms.fields.ChoiceField",
        {
            "choices": get_llm_choices,
        },
    ],
    "nlp_select": [
        "django.forms.fields.ChoiceField",
        {
            "choices": get_nlp_choices,
        },
    ],
}
CONSTANCE_CONFIG = collections.OrderedDict(
    {
        "REDDITOR_PROCESSING_ENABLED": (
            decouple.config("REDDITOR_PROCESSING_ENABLED", cast=bool, default=False),
            "Enabled processing of reddit redditors.",
            "checkbox",
        ),
        "REDDITOR_PROCESSING_DISABLED_MESSAGE": (
            "Redditor processing disabled for all users",
            "Status message returned when REDDITOR_PROCESSING_ENABLED=False",
        ),
        "THREAD_PROCESSING_ENABLED": (
            decouple.config("THREAD_PROCESSING_ENABLED", cast=bool, default=False),
            "Enabled processing of reddit threads.",
            "checkbox",
        ),
        "THREAD_PROCESSING_DISABLED_MESSAGE": (
            "Thread processing disabled for all users",
            "Status message returned when THREAD_PROCESSING_ENABLED=False",
        ),
        "LLM_NAME": (
            "gpt-4o-2024-08-06",
            "Large language model to use for prompts. OpenAI models currently only supported - "
            "https://platform.openai.com/docs/models/",
            "llm_select",
        ),
        "NLP_NAME": (
            "textblob",
            "Natural language processing package to use. textblob currently only supported - "
            "https://textblob.readthedocs.io/en/dev/",
            "nlp_select",
        ),
        "REDDITOR_LLM_PROMPT": (
            "The following pipe delimited messages are unrelated submissions posted by a person. "
            "Determine the age and IQ of that person based on their writing. Provide a confidence "
            "value that represents how accurate you believe your response to be as a value between "
            "0 and 100 where 0 represents no confidence and 100 represents absolute certainty.",
            "Prompt sent to the OpenAI API to infer data about redditors based on their submissions.",
        ),
        "THREAD_LLM_PROMPT": (
            "The following pipe delimited messages are unrelated submissions posted by multiple people. "
            "Generate a brief summary of what is being discussed.",
            "Prompt sent to the OpenAI API to infer data about redditors based on their submissions.",
        ),
        "SUBMISSION_FILTER_MAX_LENGTH": (
            decouple.config("SUBMISSION_FILTER_MAX_LENGTH", cast=int, default=2000),
            "The maximum number of characters allowed for the text of a single submission to be included in "
            "processing. This is the length of the text after filtering. Applying a limit to the maximum number "
            "of characters helps exclude text copied from other sources.",
        ),
        "SUBMISSION_FILTER_MIN_LENGTH": (
            decouple.config("SUBMISSION_FILTER_MIN_LENGTH", cast=int, default=120),
            "The minimum number of characters required for the text of a single submission to be included in "
            "processing. This is the length of the text after filtering.",
        ),
        "REDDITOR_MIN_SUBMISSIONS": (
            decouple.config("REDDITOR_MIN_SUBMISSIONS", cast=int, default=1),
            "The minimum number of submissions (comments + threads) that must be available for a redditor to "
            "be processed.",
        ),
        "THREAD_MIN_SUBMISSIONS": (
            decouple.config("THREAD_MIN_SUBMISSIONS", cast=int, default=1),
            "The minimum number of comments that must be available after filtering for processing to occur.",
        ),
        "REDDITOR_FRESHNESS_TD": (
            timedelta(days=30),
            "Defines how long `Redditor` database entries are considered fresh. Entries older than this timedelta "
            "will be reprocessed if their username is submitted in an API request.",
            timedelta,
        ),
        "THREAD_FRESHNESS_TD": (
            timedelta(minutes=15),
            "Defines how long `Thread` database entries are considered fresh. Entries older than this timedelta "
            "will be reprocessed if their URL path is submitted in an API request.",
            timedelta,
        ),
        "UNPROCESSABLE_REDDITOR_EXP_TD": (
            timedelta(days=1),
            "Defines how long `UnprocessableRedditor` entries will remain in the database before being deleted. After "
            "deletion, previously unprocessable usernames will be reattempted if included in an API request.",
            timedelta,
        ),
        "UNPROCESSABLE_THREAD_EXP_TD": (
            timedelta(minutes=15),
            "Defines how long `UnprocessableThread` entries will remain in the database before being deleted. After "
            "deletion, previously unprocessable paths will be reattempted if included in an API request.",
            timedelta,
        ),
        "API_V1_STATUS_MESSAGE": (
            "",
            "A custom message that will be included in the response from /api/v1/status",
        ),
    }
)

OPENAI_API = openai.OpenAI(api_key=decouple.config("OPENAI_API_KEY"))
REDDIT_API = praw.Reddit(
    client_id=decouple.config("REDDIT_API_CLIENT_ID"),
    client_secret=decouple.config("REDDIT_API_CLIENT_SECRET"),
    password=decouple.config("REDDIT_API_PASSWORD"),
    ratelimit_seconds=300,
    user_agent=decouple.config("REDDIT_API_USER_AGENT"),
    username=decouple.config("REDDIT_API_USERNAME"),
)
