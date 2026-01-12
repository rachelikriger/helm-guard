FROM node:20-alpine AS build

WORKDIR /app

# ---------- build shared FIRST ----------
COPY shared/package.json shared/package-lock.json ./shared/
RUN npm --prefix ./shared ci

COPY shared/tsconfig.json shared/src ./shared/
RUN npm --prefix ./shared run build

# ---------- then build cli ----------
COPY cli/package.json cli/package-lock.json ./cli/
RUN npm --prefix ./cli ci

COPY cli ./cli
RUN npm --prefix ./cli run build


# ---------- runtime ----------
FROM node-helm-oc

WORKDIR /app/cli
ENV NODE_ENV=production
ENV PATH="/app/cli/node_modules/.bin:$PATH"

# shared runtime artifacts
COPY --from=build /app/shared/package.json /app/shared/package.json
COPY --from=build /app/shared/dist /app/shared/dist

# cli runtime deps
COPY cli/package.json cli/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# cli compiled output
COPY --from=build /app/cli/dist ./dist

# OpenShift permissions
RUN chgrp -R 0 /app && chmod -R g=u /app

USER 1001:0
ENTRYPOINT ["helm-guard"]
