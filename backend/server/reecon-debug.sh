#!/usr/bin/env bash

set -e

supervisorctl stop gunicorn

python /server/manage.py prepare_app --all

exec /usr/local/bin/gunicorn --log-level=debug --workers=1 --timeout=999999 --config=/etc/gunicorn.py proj.wsgi "$*"
