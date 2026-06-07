#!/bin/sh
set -e

yarn install --frozen-lockfile

if [ -n "${APP_UID}" ] && [ -n "${APP_GID}" ]; then
  chown -R "${APP_UID}:${APP_GID}" /app/node_modules
  exec su-exec "${APP_UID}:${APP_GID}" "$@"
fi

exec "$@"
