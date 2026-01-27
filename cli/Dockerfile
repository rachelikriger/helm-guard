FROM node:20-alpine AS build

WORKDIR /app

# ---------- build shared FIRST ----------
COPY shared/package.json shared/package-lock.json shared/tsconfig.json ./shared/
RUN npm --prefix ./shared ci

COPY shared/src ./shared/src
RUN npm --prefix ./shared run build

# ---------- then build cli ----------
COPY cli/package.json cli/package-lock.json cli/tsconfig.json ./cli/
RUN npm --prefix ./cli ci

COPY cli/src ./cli/src
RUN npm --prefix ./cli run build

# ---------- runtime ----------
FROM node-helm-oc:local

WORKDIR /app/cli
ENV NODE_ENV=production
ENV PATH="/app/cli/node_modules/.bin:$PATH"

# shared runtime artifacts
COPY --chown=1001:0 --from=build /app/shared/package.json /app/shared/package.json
COPY --chown=1001:0 --from=build /app/shared/dist /app/shared/dist

# cli runtime deps
COPY --chown=1001:0 cli/package.json cli/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# cli compiled output
COPY --chown=1001:0 --from=build /app/cli/dist ./dist

USER 1001:0
ENTRYPOINT ["node", "dist/index.js"]
