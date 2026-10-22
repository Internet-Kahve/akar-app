# Akar API image. Build from the repository root (the API uses the @akar/domain workspace package):
#   docker build -f services/api/Dockerfile -t akar-api .
# Server:     docker run --env-file <env> -p 4000:4000 akar-api
# Migrations: docker run --env-file <env> akar-api node src/db/migrate.ts   (before each deploy that adds one)
# Node runs the TypeScript sources directly (type stripping, Node ≥ 24); there is no build step and no tsx at runtime.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/api/package.json services/api/
COPY packages/domain/package.json packages/domain/
COPY packages/api-client/package.json packages/api-client/
RUN npm ci --omit=dev --workspace @akar/api --include-workspace-root=false --ignore-scripts --no-audit --no-fund

FROM node:24-slim
# MODULE_TYPELESS_PACKAGE_JSON: the shared packages have no "type" field; Node detects ESM once per file and warns.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000 \
    NODE_OPTIONS=--disable-warning=MODULE_TYPELESS_PACKAGE_JSON
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY package.json ./
COPY packages/domain packages/domain
COPY packages/api-client packages/api-client
COPY services/api/package.json services/api/
COPY services/api/drizzle services/api/drizzle
COPY services/api/src services/api/src
WORKDIR /app/services/api
# The panel import caches geocoder answers in .cache/; everything else is read-only.
RUN mkdir .cache && chown node:node .cache
USER node
EXPOSE 4000
CMD ["node", "src/server.ts"]
