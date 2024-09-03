#!/usr/bin/env bash

# Helper script to connection to redis

CMD="PGPASSWORD=${POSTGRES_PASSWORD} psql --dbname=${POSTGRES_DB} --host=${POSTGRES_HOST} --port=${POSTGRES_PORT} --set=sslmode=require --username=${POSTGRES_USER}"

if [ $# -eq 0 ]
  then
    # No args provided. Connect to db
    exec redis-cli --tls -u "rediss://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}"
  else
    # Pass args to psql and execute in db container
    bash -c "redis-cli --tls -u rediss://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT} '$*'";
fi
