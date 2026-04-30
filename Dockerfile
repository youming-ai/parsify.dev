# syntax=docker/dockerfile:1.7

# Stage 1 — build static site with bun
FROM oven/bun:1.3.5-alpine AS builder
WORKDIR /app

# Install deps with the lockfile alone first so Docker can cache this layer
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest and build to ./dist
COPY . .
RUN bun run build

# Stage 2 — serve dist/ with nginx
FROM nginx:1.27-alpine AS runtime

# Replace the default site config
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

# Copy static output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
