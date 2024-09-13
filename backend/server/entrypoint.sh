#!/usr/bin/env bash

# Do not use `set -e` here because this script will stop running if `pg_isready` fails.
# However, we want `pg_isready` to keep trying until it succeeds.

mkdir -p /var/log/supervisor/{gunicorn,nginx,rq-worker}

counter=0
until pg_isready --dbname="${POSTGRES_DB}" --host="${POSTGRES_HOST}" --port="${POSTGRES_PORT}" --username="${POSTGRES_USER}";
do
  ((counter++))
  echo "Waiting for postgres to accept connections: attempt ${counter}" | tee /var/log/entrypoint.log
  sleep 1;
done;

# Custom management command to collect static, generate api schema, and apply db migrations.
# This is in a custom management command so that it can easily be run from debug.sh without
# having to list duplicate manage.py commands in entrypoint.sh and debug.sh as everything is
# defined in one place (management/commands/prepare_app.py).
python /server/manage.py prepare_app --all

exec supervisord --user root --nodaemon --configuration /etc/supervisor/conf.d/supervisord.conf
