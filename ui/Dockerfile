# syntax=docker/dockerfile:1
FROM node:20-alpine AS build

WORKDIR /app

COPY ui/package.json ui/package-lock.json ./ui/
RUN npm --prefix ./ui ci

COPY ui ./ui
COPY shared ./shared
RUN npm --prefix ./ui run build

FROM nginx:1.25-alpine AS runtime

COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/ui/dist/ /usr/share/nginx/html/

# OpenShift runs with a random UID; keep runtime dirs group-writable for GID 0.
RUN chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /var/run \
  && chmod -R g=u /usr/share/nginx/html /var/cache/nginx /var/run

EXPOSE 8080
USER 1001:0
CMD ["nginx", "-g", "daemon off;"]
