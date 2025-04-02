#!/usr/bin/env bash

set -e

supervisorctl stop rq-worker

uv run python /worker/manage.py rqworker-pool high default low --num-workers=1
