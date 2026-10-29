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

# Meu pc é ARM64 (aarch64), mas comente esta linha se estiver usando outra arquitetura
RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates curl openjdk-17-jre \
	&& rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://dl.eviware.com/soapuios/5.9.1/SoapUI-5.9.1-linux-bin.tar.gz \
	| tar -xz -C /opt
RUN curl -fsSL https://download2.gluonhq.com/openjfx/17.0.21/openjfx-17.0.21_linux-aarch64_bin-sdk.zip \
	-o /tmp/openjfx.zip \
	&& echo 'aba1cf3403352087d26613ed788006401cd12fb3466cd485f9119b7e84ea1aed  /tmp/openjfx.zip' | sha256sum -c - \
	&& unzip -q /tmp/openjfx.zip -d /opt \
	&& rm /opt/SoapUI-5.9.1/lib/javafx-*.jar \
	&& cp /opt/javafx-sdk-17.0.21/lib/*.jar /opt/SoapUI-5.9.1/lib/ \
	&& cp /opt/javafx-sdk-17.0.21/lib/*.so /opt/SoapUI-5.9.1/bin/ \
	&& rm /tmp/openjfx.zip
COPY soapui/ /etc/xdg/autostart/

EXPOSE 3001