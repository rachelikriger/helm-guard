FROM node:20-alpine AS build

WORKDIR /app
COPY cli/package.json cli/package-lock.json ./cli/
RUN npm --prefix ./cli ci

COPY cli ./cli
COPY shared ./shared
RUN npm --prefix ./cli run build

FROM node-helm-oc

WORKDIR /app/cli
ENV NODE_ENV=production
ENV PATH="/app/cli/node_modules/.bin:$PATH"

COPY cli/package.json cli/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/cli/dist ./dist
COPY --from=build /app/shared/dist /app/shared/dist

RUN chgrp -R 0 /app && chmod -R g=u /app

USER 1001:0
ENTRYPOINT ["helm-guard"]
