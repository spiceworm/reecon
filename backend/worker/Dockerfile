FROM reecon:0.3.11

WORKDIR /worker

COPY . /worker

RUN mv /worker/reecon-debug.sh /usr/local/bin/ \
    && ln -s /worker/supervisord.conf /etc/supervisor/conf.d/

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
     uv sync --frozen --no-dev

ENTRYPOINT [ "/worker/entrypoint.sh" ]
