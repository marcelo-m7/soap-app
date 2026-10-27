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

FROM lscr.io/linuxserver/webtop:ubuntu-xfce AS soapui

RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates curl openjdk-17-jre \
	&& rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://dl.eviware.com/soapuios/5.9.1/SoapUI-5.9.1-linux-bin.tar.gz \
	| tar -xz -C /opt
COPY soapui/ /etc/xdg/autostart/

EXPOSE 3001