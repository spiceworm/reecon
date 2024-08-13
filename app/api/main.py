import contextlib
import logging

from asyncpgsa import pg
import fastapi
from fastapi.middleware.cors import CORSMiddleware
import sqlalchemy

from .config import settings
from .models import ModelBase
from .v1 import router as v1_router


logging.basicConfig(
    datefmt="%H:%M:%S",
    format="%(asctime)s,%(msecs)d %(name)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(settings.log_dir / "api.log"),
    ],
)
log = logging.getLogger(__file__)
log.setLevel(settings.log_level)


@contextlib.asynccontextmanager
async def lifespan(app_: fastapi.FastAPI):
    log.debug("Starting API")
    await pg.init(
        dsn=settings.db_connection_string,
        min_size=5,
        max_size=10,
    )
    engine = sqlalchemy.create_engine(
        settings.db_connection_string,
        echo=settings.debug,
    )
    ModelBase.metadata.create_all(engine)
    yield
    log.debug("Stopping API")


def create_app():
    api = fastapi.FastAPI(lifespan=lifespan)
    api.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
    )
    api.include_router(v1_router, prefix="/api/v1")
    return api


app = create_app()
