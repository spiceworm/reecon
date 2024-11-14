#!/usr/bin/env bash

set -e

supervisorctl stop rq-worker

/usr/local/bin/python /worker/manage.py rqworker-pool default --num-workers=1
