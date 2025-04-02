#!/usr/bin/env bash

set -e

supervisorctl stop gunicorn

uv run python /server/manage.py prepare_app --all

exec uv run gunicorn --log-level=debug --workers=1 --timeout=999999 --config=/etc/gunicorn.py proj.wsgi "$*"
