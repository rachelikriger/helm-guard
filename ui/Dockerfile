# syntax=docker/dockerfile:1
FROM node:20-alpine AS build

WORKDIR /app

# ---------- build shared FIRST ----------
COPY shared/package.json shared/package-lock.json shared/tsconfig.json ./shared/
RUN npm --prefix ./shared ci

COPY shared/src ./shared/src
RUN npm --prefix ./shared run build

# ---------- then build ui ----------
COPY ui/package.json ui/package-lock.json ui/tsconfig.json ./ui/
RUN npm config set registry https://registry.npmjs.org/ \
  && npm --prefix ./ui ci

COPY ui ./ui
RUN npm --prefix ./ui run build

# ---------- runtime ----------
FROM nginx:1.25-alpine AS runtime

RUN apk add --no-cache gettext

COPY ui/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY ui/entrypoint.sh /entrypoint.sh
COPY --from=build /app/ui/dist/ /usr/share/nginx/html/

RUN chmod +x /entrypoint.sh

# OpenShift runs with a random UID; keep runtime dirs group-writable for GID 0.
RUN chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /var/run /entrypoint.sh \
  && chmod -R g=u /usr/share/nginx/html /var/cache/nginx /var/run

EXPOSE 8080
USER 1001:0
ENTRYPOINT ["/entrypoint.sh"]
