#!/usr/bin/env bash

set -e

mkdir -p /var/log/supervisor/{app,nginx}

counter=0
until pg_isready --dbname="${POSTGRES_DB}" --host="${POSTGRES_HOST}" --port="${POSTGRES_PORT}" --username="${POSTGRES_USER}";
do
  ((counter++))
  echo "Waiting for postgres to accept connections: attempt ${counter}" | tee /var/log/entrypoint.log
  sleep 1;
done;

exec supervisord --user root --nodaemon --configuration /etc/supervisor/conf.d/supervisord.conf
