#!/usr/bin/env bash

set -e

export TOX_ARGS="$*"

docker compose -f docker-compose-test.yml down --remove-orphans

# Rebuild all services so all uv environments have up-to-date
# packages that include any changes made to the reecon package.
docker compose build

exec docker compose -f docker-compose-test.yml up --build
