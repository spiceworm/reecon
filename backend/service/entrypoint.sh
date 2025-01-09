#!/usr/bin/env bash

# Do not use `set -e` here because this script will stop running if an `until` command fails when
# it should try multiple times.

mkdir -p /var/log/supervisor/{reecon_admin,rq-scheduler}

LOG=/var/log/entrypoint.log

db_counter=0
until pg_isready --dbname="${POSTGRES_DB}" --host="${POSTGRES_HOST}" --port="${POSTGRES_PORT}" --username="${POSTGRES_USER}";
do
  ((db_counter++))
  echo "Waiting for postgres to accept connections: attempt ${db_counter}" | tee "${LOG}"
  sleep 1;
done;

redis_counter=0
until /usr/local/bin/reecon-redis.sh PING;
do
  ((redis_counter++))
  echo "Waiting for redis to accept connections: attempt ${redis_counter}" | tee "${LOG}"
  sleep 1;
done;

echo "Starting supervisord" | tee "${LOG}"
exec supervisord --user root --nodaemon --configuration /etc/supervisor/conf.d/supervisord.conf
