FROM reecon:0.3.9

EXPOSE 80

HEALTHCHECK CMD curl --fail http://localhost:80/api/v1/status/ || exit 1

WORKDIR /server

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        nginx \
    && apt-get clean \
    && rm -Rf /var/lib/apt/lists/*

COPY . /server

# Remove the default nginx config so ours can use the `default_server` setting in the `listen` directive
# and also set `server_name _;` so nginx will respond if we query by domain name or IP address.
RUN mv /server/reecon-debug.sh /usr/local/bin/ \
    && rm /etc/nginx/sites-enabled/default \
    && ln -s /server/nginx.conf /etc/nginx/conf.d/server.conf \
    && ln -s /server/gunicorn.py /etc/ \
    && ln -s /server/supervisord.conf /etc/supervisor/conf.d/

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
     uv sync --frozen --no-dev

ENTRYPOINT [ "/server/entrypoint.sh" ]
