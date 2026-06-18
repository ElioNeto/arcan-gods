# ============================================================
# Arcan Gods — Server Dockerfile
# Multi-stage: build shared → build server → production runtime
# ============================================================

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root workspace config
COPY package.json tsconfig.base.json ./

# Copy shared package (needed for build)
COPY packages/shared/ packages/shared/

# Copy server package config
COPY packages/server/package.json packages/server/

# Install ALL dependencies (including devDeps for build)
RUN npm install

# ---- Stage 2: Build shared package ----
FROM deps AS build-shared
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared/ packages/shared/
RUN npm run build -w packages/shared

# ---- Stage 3: Build server ----
FROM build-shared AS build-server
WORKDIR /app
COPY --from=build-shared /app/packages/shared/dist ./packages/shared/dist
COPY packages/server/ packages/server/
RUN npm run build -w packages/server

# ---- Stage 4: Production runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built artifacts
COPY --from=build-server /app/packages/shared/dist ./packages/shared/dist
COPY --from=build-server /app/packages/server/dist ./packages/server/dist
COPY --from=build-server /app/packages/server/package.json ./packages/server/
COPY --from=build-server /app/node_modules ./node_modules

# Copy production dependencies only
RUN npm prune --omit=dev

# Copy tilemap maps
COPY --from=build-server /app/packages/server/src/game/tilemap/maps ./packages/server/dist/game/tilemap/maps

# Environment
ENV NODE_ENV=production
EXPOSE 3001

WORKDIR /app/packages/server
CMD ["node", "dist/index.js"]
