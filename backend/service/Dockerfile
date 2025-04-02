FROM reecon:0.3.9

WORKDIR /service

COPY . /service

RUN ln -s /service/supervisord.conf /etc/supervisor/conf.d/

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
     uv sync --frozen --no-dev

ENTRYPOINT [ "/service/entrypoint.sh" ]
