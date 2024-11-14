#!/usr/bin/env bash

# Helper script to connection to redis

if [ "${PRODUCTION}" = "True" ]; then
  echo "Connecting with production options"
  CMD="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} --user ${REDIS_USERNAME} --pass ${REDIS_PASSWORD} --tls --insecure"
else
  CMD="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT:-6379} --user ${REDIS_USERNAME} --pass ${REDIS_PASSWORD}"
fi


if [ $# -eq 0 ]
  then
    # No args provided. Connect to db
    exec bash -c "${CMD}"
  else
    # Pass args to psql and execute in db container
    bash -c "${CMD} '$*'";
fi
