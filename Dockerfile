FROM oven/bun:1.4.4 AS backend

WORKDIR /app/soap-server
COPY soap-server/ ./
RUN bun install --frozen-lockfile

EXPOSE 3000
CMD ["bun", "src/index.ts"]

FROM oven/bun:1.4.4 AS frontend

WORKDIR /app/soap-app
COPY soap-app/ ./
RUN bun install --frozen-lockfile
RUN bun run build.ts

ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "src/index.ts"]