import contextlib
import logging

import arq
from asyncio import current_task
import fastapi
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import (
    async_scoped_session,
    async_sessionmaker,
    create_async_engine,
)

from .config import settings
from .models import Base
from .api.v1 import api_router as api_v1_router
from .endpoints import endpoint_router


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

    engine = create_async_engine(
        settings.db_connection_string,
        connect_args=settings.db_connection_args,
        echo=settings.debug,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    app_.db_session = async_scoped_session(
        async_sessionmaker(engine, expire_on_commit=False),
        scopefunc=current_task,
    )
    app_.redis = await arq.create_pool(settings.redis_connection_settings)
    yield
    log.debug("Stopping API")
    await engine.dispose()


def create_app():
    _app = fastapi.FastAPI(lifespan=lifespan)
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
    )
    _app.include_router(api_v1_router, prefix="/api/v1")
    _app.include_router(endpoint_router)
    return _app


app = create_app()
