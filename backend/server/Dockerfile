ARG VERSION=latest

FROM reecon:${VERSION}

EXPOSE 80

HEALTHCHECK CMD curl --fail http://localhost:80/api/v1/status/ || exit 1

WORKDIR /server

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        nginx \
    && apt-get clean \
    && rm -Rf /var/lib/apt/lists/*

RUN pip install --upgrade pip \
    && pip install  \
        gunicorn

COPY ./requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

COPY . /server

# Remove the default nginx config so ours can use the `default_server` setting in the `listen` directive
# and also set `server_name _;` so nginx will respond if we query by domain name or IP address.
RUN mv /server/reecon-debug.sh /usr/local/bin/ \
    && rm /etc/nginx/sites-enabled/default \
    && ln -s /server/nginx.conf /etc/nginx/conf.d/server.conf \
    && ln -s /server/gunicorn.py /etc/ \
    && ln -s /server/supervisord.conf /etc/supervisor/conf.d/

ENTRYPOINT [ "/server/entrypoint.sh" ]
