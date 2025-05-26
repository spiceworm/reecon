FROM python:3.13.2-bookworm
COPY --from=ghcr.io/astral-sh/uv:0.7.8 /uv /uvx /bin/

WORKDIR /reecon

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gettext-base \
        htop \
        nginx \
        libpq-dev \
        postgresql-client-15 \
        postgresql-client-common \
        redis \
        supervisor \
        vim \
    && apt-get clean \
    && rm -Rf /var/lib/apt/lists/*

COPY . /reecon

RUN mv ./reecon-redis.sh /usr/local/bin/

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
     uv sync --frozen --no-dev
