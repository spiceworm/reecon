#!/usr/bin/env bash

set -e

supervisorctl stop app

exec /usr/local/bin/uvicorn --app-dir=/app --host=127.0.0.1 --port=8000 application.main:app
