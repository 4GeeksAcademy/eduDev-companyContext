FROM node:24-alpine
WORKDIR /app/uis
COPY website/package.json website/package-lock.json ./website/
RUN cd website && npm ci --no-audit --no-fund
COPY backoffice/package.json backoffice/package-lock.json ./backoffice/
RUN cd backoffice && npm ci --no-audit --no-fund
COPY website/ ./website/
COPY backoffice/ ./backoffice/
COPY start.sh ./start.sh
ENV BACKOFFICE_LEGACY_PORT=3002
EXPOSE 3000 3001
CMD ["sh", "/app/uis/start.sh"]
