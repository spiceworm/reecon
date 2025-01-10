import collections
from datetime import timedelta

import decouple


SECRET_KEY = decouple.config("SECRET_KEY")
DEBUG = decouple.config("DEBUG", cast=bool, default=False)
PRODUCTION = decouple.config("PRODUCTION", cast=bool, default=False)
LOG_LEVEL = decouple.config(
    "LOG_LEVEL",
    default="DEBUG" if DEBUG else "INFO",
    cast=decouple.Choices(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]),
)

AUTH_USER_MODEL = "reecon.AppUser"

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

RQ = {
    "DEFAULT_RESULT_TTL": 5000,
}

RQ_QUEUES = {
    "high": {
        "USE_REDIS_CACHE": "default",
    },
    "default": {
        "USE_REDIS_CACHE": "default",
    },
    "low": {
        "USE_REDIS_CACHE": "default",
    },
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


def get_llm_choices():
    # Importing a model cannot happen at the top of the file.
    from reecon.util.producer import get_llm_choices

    return get_llm_choices()


def get_nlp_choices():
    # Importing a model cannot happen at the top of the file.
    from reecon.util.producer import get_nlp_choices

    return get_nlp_choices()


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
        "REDDITOR_CONTEXT_QUERY_PROCESSING_ENABLED": (
            False,
            "Enable processing of context queries for reddit redditors.",
            "checkbox",
        ),
        "REDDITOR_DATA_PROCESSING_ENABLED": (
            False,
            "Enable processing of data for reddit redditors.",
            "checkbox",
        ),
        "THREAD_CONTEXT_QUERY_PROCESSING_ENABLED": (
            False,
            "Enable processing of context queries for reddit threads.",
            "checkbox",
        ),
        "THREAD_DATA_PROCESSING_ENABLED": (
            False,
            "Enable processing of data for reddit threads.",
            "checkbox",
        ),
        "LLM_NAME": (
            "gpt-4o-mini-2024-07-18",
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
        "REDDITOR_LLM_CONTEXT_QUERY_PROMPT": (
            "The following pipe delimited messages are unrelated submissions posted by a person ordered from newest "
            "to oldest. ",
            "Default prompt that populates the redditor context query form that can be modified by the user before "
            "they submit the query for processing. Whatever they change it to is what will be sent to the LLM for "
            "redditor context query processing.",
        ),
        "REDDITOR_LLM_DATA_PROMPT": (
            "The following pipe delimited messages are unrelated submissions posted by a person ordered from newest "
            "to oldest. "
            "Determine the age, a list of interests ordered from most to least relevant, and the IQ of the person "
            "based on their writing. Also generate a short summary that describes the author that uses 100 "
            "completion_tokens or less. Be as objective as possible.",
            "Prompt sent to the LLM for redditor data processing.",
        ),
        "THREAD_LLM_CONTEXT_QUERY_PROMPT": (
            "The following pipe delimited messages are unrelated submissions posted by multiple people.",
            "Default prompt that populates the thread context query form that can be modified by the user before "
            "they submit the query for processing. Whatever they change it to is what will be sent to the LLM for "
            "thread context query processing.",
        ),
        "THREAD_LLM_DATA_PROMPT": (
            "The following pipe delimited messages are unrelated submissions posted by multiple people. Determine "
            "a list of keywords that describe the discussion ordered from most to least relevant. Also generate a "
            "brief summary of what is being discussed that uses 100 completion_tokens or less. Be as objective as "
            "possible.",
            "Prompt sent to the LLM for thread data processing.",
        ),
        "LLM_MAX_CONTEXT_WINDOW_FOR_INPUTS": (
            0.8,
            "The maximum percentage (expressed as a decimal from 0 to 1) of the LLM context window tokens "
            "that can be used for inputs.",
        ),
        "SUBMISSION_FILTER_MAX_LENGTH": (
            3000,
            "The maximum number of characters allowed for the text of a single submission to be included in "
            "processing. This is the length of the text after filtering. Applying a limit to the maximum number "
            "of characters helps exclude text copied from other sources.",
        ),
        "SUBMISSION_FILTER_MIN_LENGTH": (
            120,
            "The minimum number of characters required for the text of a single submission to be included in "
            "processing. This is the length of the text after filtering.",
        ),
        "REDDITOR_MIN_SUBMISSIONS": (
            5,
            "The minimum number of submissions available after filtering for processing of a redditor to occur.",
        ),
        "THREAD_MIN_SUBMISSIONS": (
            5,
            "The minimum number of submissions available after filtering for processing of a thread to occur.",
        ),
        "REDDITOR_FRESHNESS_TD": (
            timedelta(days=30),
            "Defines how long `Redditor` database entries are considered fresh. Entries older than this timedelta "
            "will be reprocessed if the username is submitted in an API request.",
            timedelta,
        ),
        "THREAD_FRESHNESS_TD": (
            timedelta(minutes=15),
            "Defines how long `Thread` database entries are considered fresh. Entries older than this timedelta "
            "will be reprocessed if the URL path is submitted in an API request.",
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
        "REDDITOR_ACCOUNT_MIN_AGE": (
            timedelta(hours=1),
            "The minimum age a redditor account must be for data processing to occur.",
            timedelta,
        ),
    }
)
