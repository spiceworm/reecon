#!/usr/bin/env bash

# Helper script to connection to redis

CMD="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT:-6379}"

if [ "${PRODUCTION}" = "True" ]; then
  export REDISCLI_AUTH="${REDIS_PASSWORD}"
  CMD="${CMD} --user ${REDIS_USERNAME} --tls --insecure"
fi


if [ $# -eq 0 ]
  then
    # No args provided. Connect to db
    exec bash -c "${CMD}"
  else
    # Pass args to psql and execute in db container
    bash -c "${CMD} '$*'";
fi
