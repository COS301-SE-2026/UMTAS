# syntax=docker/dockerfile:1.7

# Deliberate base-image policy: track patched Node 22/bookworm-slim releases and
# rebuild through the normal dependency/image scanning pipeline.
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS node-base
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

FROM node-base AS node-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/pdf_parser/worker/package.json ./apps/pdf_parser/worker/package.json
COPY packages/bullmq-worker-core/package.json ./packages/bullmq-worker-core/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
RUN pnpm install --frozen-lockfile --filter pdf-parser-worker...

FROM node-deps AS node-build
COPY apps/pdf_parser/worker ./apps/pdf_parser/worker
COPY packages/bullmq-worker-core ./packages/bullmq-worker-core
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter shared-types build \
    && pnpm --filter bullmq-worker-core build \
    && pnpm --filter pdf-parser-worker build \
    && pnpm --config.inject-workspace-packages=true --filter pdf-parser-worker deploy --prod /deploy \
    && cp -R apps/pdf_parser/worker/dist /deploy/dist

FROM ${NODE_IMAGE} AS python-deps
RUN apt-get update \
    && apt-get install --yes --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*
COPY apps/pdf_parser/requirements.txt /tmp/requirements.txt
RUN python3 -m venv /opt/pdf-parser-venv \
    && /opt/pdf-parser-venv/bin/pip install --no-cache-dir --requirement /tmp/requirements.txt

FROM ${NODE_IMAGE} AS runtime
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=dev
LABEL org.opencontainers.image.title="UMTAS PDF parser worker" \
      org.opencontainers.image.description="BullMQ worker for parsing timetable PDFs" \
      org.opencontainers.image.source="https://github.com/Vigilant-Computation/UMTAS" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.base.name="docker.io/library/node:22-bookworm-slim" \
      io.umtas.base-image.update-policy="Track patched Node 22 bookworm-slim releases"

RUN apt-get update \
    && apt-get install --yes --no-install-recommends dumb-init python3 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/python /tmp/umtas-worker \
    && chown -R node:node /app /tmp/umtas-worker

WORKDIR /app
ENV NODE_ENV=production \
    PATH="/opt/pdf-parser-venv/bin:${PATH}" \
    PDF_PARSE_CLI_COMMAND=python3 \
    PDF_PARSE_CLI_ARGS="-m parser_cli" \
    PDF_PARSE_CLI_CWD=/app/python \
    WORKER_TEMP_ROOT=/tmp/umtas-worker

COPY --from=node-build --chown=node:node /deploy/ /app/
COPY --from=python-deps /opt/pdf-parser-venv /opt/pdf-parser-venv
COPY --chown=node:node apps/pdf_parser/parser /app/python/parser
COPY --chown=node:node apps/pdf_parser/parser_cli.py /app/python/parser_cli.py

USER node
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/dist/index.js"]

FROM runtime AS smoke
COPY --chown=node:node apps/pdf_parser/up_test_pdfs/SEM_TESTS_S2.pdf /tmp/parser-smoke.pdf
RUN cd /app/python \
    && python3 -m parser_cli --adapter up --file /tmp/parser-smoke.pdf > /tmp/parser-smoke.json \
    && node -e "JSON.parse(require('fs').readFileSync('/tmp/parser-smoke.json','utf8'))" \
    && touch /tmp/image-smoke-ok

FROM runtime AS final
COPY --from=smoke --chown=node:node /tmp/image-smoke-ok /app/.image-smoke-ok
