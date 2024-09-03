import logging
from pathlib import Path

from arq.connections import RedisSettings
import decouple


__all__ = ("settings",)


log = logging.getLogger(__file__)


class _Settings:
    @property
    def comment_filter_settings(self) -> dict:
        return {
            "exclude_urls": decouple.config("COMMENT_FILTER_EXCLUDE_URLS", cast=bool, default=True),
            "min_length": decouple.config("COMMENT_FILTER_MIN_LENGTH", cast=int, default=120),
        }

    @property
    def db_connection_args(self) -> dict:
        return {"ssl": decouple.config("POSTGRES_SSL")}

    @property
    def db_connection_string(self) -> str:
        db = decouple.config("POSTGRES_DB")
        host = decouple.config("POSTGRES_HOST")
        password = decouple.config("POSTGRES_PASSWORD")
        port = decouple.config("POSTGRES_PORT")
        user = decouple.config("POSTGRES_USER")
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"

    @property
    def debug(self) -> bool:
        return decouple.config("DEBUG", cast=bool, default=False)

    @property
    def log_dir(self) -> Path:
        return Path(decouple.config("LOG_DIR", default="/var/log/supervisor/app"))

    @property
    def log_level(self) -> int:
        level = decouple.config("LOG_LEVEL", default="INFO")
        try:
            return getattr(logging, level)
        except AttributeError:
            log.exception("Invalid log level: %s", level)

    @property
    def openai_settings(self) -> dict:
        return {
            "api_key": decouple.config("OPENAI_API_KEY"),
            "max_tokens": decouple.config("OPENAI_MODEL_MAX_TOKENS", cast=int),
            "model": decouple.config("OPENAI_MODEL"),
        }

    @property
    def reddit_api_settings(self) -> dict:
        return {
            "client_id": decouple.config("REDDIT_API_CLIENT_ID"),
            "client_secret": decouple.config("REDDIT_API_CLIENT_SECRET"),
            "password": decouple.config("REDDIT_API_PASSWORD"),
            "user_agent": decouple.config("REDDIT_API_USER_AGENT"),
            "username": decouple.config("REDDIT_API_USERNAME"),
        }

    @property
    def redis_connection_settings(self) -> RedisSettings:
        return RedisSettings(
            host=decouple.config("REDIS_HOST"),
            password=decouple.config("REDIS_PASSWORD", default=None),
            port=decouple.config("REDIS_PORT", cast=int, default=6379),
            ssl=decouple.config("REDIS_SSL", cast=bool, default=False),
            username=decouple.config("REDIS_USERNAME", default=None),
            ssl_cert_reqs="none",
        )

    @property
    def secret_key(self) -> str:
        return decouple.config("SECRET_KEY")


settings = _Settings()
