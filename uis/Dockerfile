FROM node:24-alpine
WORKDIR /app/uis
COPY website/package.json website/package-lock.json ./website/
RUN cd website && npm ci --include=dev --no-audit --no-fund
COPY backoffice/package.json backoffice/package-lock.json ./backoffice/
RUN cd backoffice && npm ci --include=dev --no-audit --no-fund
COPY talent-pipeline-tracker/package.json talent-pipeline-tracker/package-lock.json ./talent-pipeline-tracker/
RUN cd talent-pipeline-tracker && npm ci --include=dev --no-audit --no-fund
COPY talent-pipeline-tracker/ ./talent-pipeline-tracker/
COPY website/ ./website/
COPY backoffice/ ./backoffice/
COPY start.sh ./start.sh
ARG TRACKFLOW_UI_MODE=development
ARG TRACKFLOW_API_PROXY=0
ARG NEXT_PUBLIC_TRACKER_BASE_PATH=/talent
ARG NEXT_PUBLIC_AUTH_API_URL=/api
ARG NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1
ENV NEXT_PUBLIC_TRACKER_BASE_PATH=${NEXT_PUBLIC_TRACKER_BASE_PATH}
ENV NEXT_PUBLIC_AUTH_API_URL=${NEXT_PUBLIC_AUTH_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG TRACKFLOW_API_ORIGIN=
ENV BACKOFFICE_LEGACY_PORT=3002
ENV TRACKFLOW_UI_MODE=${TRACKFLOW_UI_MODE}
ENV TRACKFLOW_API_PROXY=${TRACKFLOW_API_PROXY}
ENV TRACKFLOW_API_ORIGIN=${TRACKFLOW_API_ORIGIN}
RUN case "$TRACKFLOW_UI_MODE" in \
      development) ;; \
      production) test "$TRACKFLOW_API_PROXY" = 1 && \
        test "$TRACKFLOW_API_ORIGIN" = http://api:8000 && \
        (cd website && npm run build && cd ../backoffice && npm run build && \
         cd ../talent-pipeline-tracker && npm run build) ;; \
      *) echo 'Invalid TRACKFLOW_UI_MODE' >&2; exit 1 ;; \
    esac
EXPOSE 3000 3001 3003
CMD ["sh", "/app/uis/start.sh"]
