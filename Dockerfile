FROM oven/bun:1-slim AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist/client ./dist/client
COPY --from=build /app/server.ts ./server.ts
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
