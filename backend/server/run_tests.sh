#!/usr/bin/env bash

set -e

export TOX_ARGS="$*"

docker compose -f docker-compose-test.yml up --build
