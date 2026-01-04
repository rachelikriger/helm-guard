# syntax=docker/dockerfile:1
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.25-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

# OpenShift runs with a random UID; keep runtime dirs group-writable for GID 0.
RUN chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /var/run \
  && chmod -R g=u /usr/share/nginx/html /var/cache/nginx /var/run

EXPOSE 8080
USER 1001:0
CMD ["nginx", "-g", "daemon off;"]
