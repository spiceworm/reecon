#!/usr/bin/env bash

set -e

mkdir -p /var/log/app

exec supervisord -c /etc/supervisor/supervisord.conf
