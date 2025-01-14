FROM python:3.13.1-bookworm

ARG VERSION

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
        tox \
        vim \
    && apt-get clean \
    && rm -Rf /var/lib/apt/lists/*

RUN pip install --upgrade pip \
    && pip install  \
        build \
        IPython

COPY ./requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt \
    && python -m textblob.download_corpora \
    && python -m nltk.downloader punkt_tab

COPY . /reecon

RUN mv ./reecon-redis.sh /usr/local/bin/ \
    && python -m build \
    && pip install /reecon/dist/reecon-${VERSION}.tar.gz
