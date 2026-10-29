FROM node:24-alpine
WORKDIR /app/uis
COPY website/package.json website/package-lock.json ./website/
RUN cd website && npm ci --include=dev --no-audit --no-fund
COPY backoffice/package.json backoffice/package-lock.json ./backoffice/
RUN cd backoffice && npm ci --include=dev --no-audit --no-fund
COPY website/ ./website/
COPY backoffice/ ./backoffice/
COPY start.sh ./start.sh
ARG TRACKFLOW_UI_MODE=development
ARG TRACKFLOW_API_PROXY=0
ARG TRACKFLOW_API_ORIGIN=
ENV BACKOFFICE_LEGACY_PORT=3002
ENV TRACKFLOW_UI_MODE=${TRACKFLOW_UI_MODE}
ENV TRACKFLOW_API_PROXY=${TRACKFLOW_API_PROXY}
ENV TRACKFLOW_API_ORIGIN=${TRACKFLOW_API_ORIGIN}
RUN case "$TRACKFLOW_UI_MODE" in \
      development) ;; \
      production) test "$TRACKFLOW_API_PROXY" = 1 && \
        test "$TRACKFLOW_API_ORIGIN" = http://api:8000 && \
        (cd website && npm run build && cd ../backoffice && npm run build) ;; \
      *) echo 'Invalid TRACKFLOW_UI_MODE' >&2; exit 1 ;; \
    esac
EXPOSE 3000 3001
CMD ["sh", "/app/uis/start.sh"]
