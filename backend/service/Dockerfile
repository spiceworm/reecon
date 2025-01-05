ARG VERSION=latest

FROM reecon:${VERSION}

WORKDIR /service

COPY ./requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

COPY . /service

RUN ln -s /service/supervisord.conf /etc/supervisor/conf.d/

ENTRYPOINT [ "/service/entrypoint.sh" ]
