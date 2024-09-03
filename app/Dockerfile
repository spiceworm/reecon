FROM python:3.12.5-bookworm

EXPOSE 80

HEALTHCHECK CMD curl --fail http://localhost:80/api/v1/status || exit 1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gettext-base \
        nginx \
        postgresql-client-15 \
        postgresql-client-common \
        redis \
        supervisor \
        vim \
    && apt-get clean \
    && rm -Rf /var/lib/apt/lists/*

RUN pip install --upgrade pip \
    && pip install  \
        IPython \
        uvicorn[standard]

# Install python dependencies and NLTK data files
COPY ./requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt \
    && python -m textblob.download_corpora \
    && python -m nltk.downloader punkt_tab

COPY . /app

# Remove the default nginx config so ours can use the `default_server` setting in the `listen`
# directive and also set `server_name _;` so nginx will respond if we query by domain name or
# IP address.
RUN rm /etc/nginx/sites-enabled/default \
    && ln -s /app/nginx.conf /etc/nginx/conf.d/api.conf \
    && ln -s /app/supervisord.conf /etc/supervisor/conf.d/

ENTRYPOINT [ "/app/entrypoint.sh" ]
