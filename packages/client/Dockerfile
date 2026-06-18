# ============================================================
# Arcan Gods — Client Dockerfile
# Multi-stage: build with Vite → serve with Nginx
# ============================================================

# ---- Stage 1: Build client ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace config
COPY package.json tsconfig.base.json ./

# Copy shared package (needed for build)
COPY packages/shared/ packages/shared/

# Copy client package config
COPY packages/client/package.json packages/client/package-lock.json* packages/client/

# Install dependencies
RUN npm install

# Build shared first
RUN npm run build -w packages/shared

# Copy client source and build
COPY packages/client/ packages/client/
RUN npm run build -w packages/client

# ---- Stage 2: Production runtime with Nginx ----
FROM nginx:alpine AS runner

# Copy built client from builder
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Custom nginx config for SPA + WebSocket proxy
RUN rm /etc/nginx/conf.d/default.conf
COPY <<'NGINX' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;
    gzip_min_length 1000;

    # Static assets with cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA: serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket proxy to server
    location /ws {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
NGINX

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
