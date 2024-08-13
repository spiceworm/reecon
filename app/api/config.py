import logging
import os
from pathlib import Path

from arq.connections import RedisSettings


__all__ = ("settings",)


log = logging.getLogger(__file__)


class _Settings:
    @property
    def db_connection_string(self) -> str:
        db = os.environ["POSTGRES_DB"]
        host = os.environ["POSTGRES_HOST"]
        password = os.environ["POSTGRES_PASSWORD"]
        port = os.environ["POSTGRES_PORT"]
        user = os.environ["POSTGRES_USER"]
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"

    @property
    def debug(self) -> bool:
        return bool(int(os.getenv("DEBUG", "1")))

    @property
    def log_dir(self) -> Path:
        return Path(os.getenv("LOG_DIR", "/var/log/app"))

    @property
    def log_level(self) -> int:
        level = os.getenv("LOG_LEVEL", "INFO")
        try:
            return getattr(logging, level)
        except AttributeError:
            log.exception("Invalid log level: %s", level)

    @property
    def openai_api_key(self) -> str:
        return os.environ["OPENAI_API_KEY"]

    @property
    def openai_model(self) -> str:
        return os.environ["OPENAI_MODEL"]

    @property
    def redis_connection_settings(self) -> RedisSettings:
        return RedisSettings(host=os.environ["REDIS_HOST"])


settings = _Settings()
