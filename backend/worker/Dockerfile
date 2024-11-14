ARG VERSION=latest

FROM reecon:${VERSION}

WORKDIR /worker

# Install python dependencies and NLTK data files
COPY ./requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

COPY . /worker

RUN mv /worker/reecon-debug.sh /usr/local/bin/ \
    && ln -s /worker/supervisord.conf /etc/supervisor/conf.d/

ENTRYPOINT [ "/worker/entrypoint.sh" ]
