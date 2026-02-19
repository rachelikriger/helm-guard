#!/bin/sh
set -e
# Substitute only GITLAB_PROXY_TOKEN to avoid breaking nginx $variables (awk from busybox, no gettext needed)
awk -v t="${GITLAB_PROXY_TOKEN}" '{gsub(/\$\{GITLAB_PROXY_TOKEN\}/, t); print}' \
  /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
