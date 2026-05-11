# =============================================================================
# Roshetta — production image
# Multi-stage build:
#   1. deps  → install all workspaces (dev included) and build the Next client
#   2. runtime → slim image with prod deps + built client + source server
# Express runs on SERVER_PORT (4000). Next.js binds to $PORT (Railway-injected)
# and rewrites /api/* to localhost:4000.
# =============================================================================

# ------------------------------- 1. builder ---------------------------------
FROM node:20-slim AS builder

WORKDIR /app
ENV NODE_ENV=development

# Workspace manifests first so the npm-install layer caches well.
COPY package.json package-lock.json* tsconfig.base.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

RUN npm install --no-audit --no-fund

# Now the sources.
COPY shared shared
COPY server server
COPY client client

# Build the Next.js client (the server runs from source via tsx in prod).
RUN npm --workspace client run build

# Drop dev deps to slim the runtime image.
RUN npm prune --omit=dev

# ------------------------------- 2. runtime ---------------------------------
FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV SERVER_PORT=4000
ENV PORT=3000
ENV API_BASE_URL=http://localhost:4000

# sharp needs libvips, multer needs ca-certs for any TLS.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app

# Railway will set $PORT for the public-facing process — Next.js binds to it.
# Express stays internal on SERVER_PORT.
EXPOSE 3000 4000

# Concurrently runs both processes in the foreground so Docker captures logs
# from each.
CMD ["npm", "run", "start:prod"]
