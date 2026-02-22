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
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=build /app/ui/dist/ ./dist/
COPY ui/server/index.mjs ./server/

# OpenShift runs with a random UID; keep runtime dirs group-writable for GID 0.
RUN chgrp -R 0 /app && chmod -R g=u /app

ENV PORT=8080
EXPOSE 8080
USER 1001:0
CMD ["node", "server/index.mjs"]
