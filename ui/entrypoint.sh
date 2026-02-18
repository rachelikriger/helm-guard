#!/bin/sh
set -e
# Substitute only GITLAB_PROXY_TOKEN to avoid breaking nginx $variables
envsubst '${GITLAB_PROXY_TOKEN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
