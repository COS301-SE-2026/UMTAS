# syntax=docker/dockerfile:1.7

# Deliberate base-image policy: track patched Node 22/bookworm-slim releases and
# rebuild through the normal dependency/image scanning pipeline.
ARG NODE_IMAGE=node:22-bookworm-slim
ARG ORTOOLS_VERSION=9.12.4544

FROM ${NODE_IMAGE} AS node-base
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

FROM node-base AS node-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/solver-worker/package.json ./apps/solver-worker/package.json
COPY packages/bullmq-worker-core/package.json ./packages/bullmq-worker-core/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
RUN pnpm install --frozen-lockfile --filter solver-worker...

FROM node-deps AS node-build
COPY apps/solver-worker ./apps/solver-worker
COPY packages/bullmq-worker-core ./packages/bullmq-worker-core
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter shared-types build \
    && pnpm --filter bullmq-worker-core build \
    && pnpm --filter solver-worker build \
    && pnpm --filter solver-worker deploy --prod --legacy /deploy \
    && cp -R apps/solver-worker/dist /deploy/dist

FROM vigilcs/umtas:ortools-base-${ORTOOLS_VERSION} AS solver-build
WORKDIR /workspace

COPY apps/preference-solver /workspace/apps/preference-solver
WORKDIR /workspace/apps/preference-solver
ENV LD_LIBRARY_PATH=/opt/ortools/lib
#Download first
RUN make lib/openGA.hpp lib/nlohmann/json.hpp 
    
RUN make clean \
    && make --jobs="$(nproc)" \
      ORTOOLS_PREFIX=/opt/ortools \
      ABSEIL_PREFIX=/opt/ortools \
      PROTOBUF_PREFIX=/opt/ortools \
    && make test \
      ORTOOLS_PREFIX=/opt/ortools \
      ABSEIL_PREFIX=/opt/ortools \
      PROTOBUF_PREFIX=/opt/ortools \
    && install -D --mode=0755 GA_BIN /out/bin/solver-cli \
    && touch /out/image-smoke-ok \
    && ldd /out/bin/solver-cli > /tmp/solver-ldd.txt \
    && if grep -F "not found" /tmp/solver-ldd.txt; then cat /tmp/solver-ldd.txt; exit 1; fi \
    && mkdir -p /out/lib \
    && cp -a /opt/ortools/lib/. /out/lib/ \
    && find /out/lib -type f ! -name '*.so*' -delete \
    && rm -rf /out/lib/pkgconfig

FROM ${NODE_IMAGE} AS runtime
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=dev
ARG ORTOOLS_VERSION=9.12.4544
LABEL org.opencontainers.image.title="UMTAS solver worker" \
      org.opencontainers.image.description="BullMQ worker for timetable optimization" \
      org.opencontainers.image.source="https://github.com/Vigilant-Computation/UMTAS" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.base.name="docker.io/library/node:22-bookworm-slim" \
      org.opencontainers.image.vendor="Vigilant Computation" \
      io.umtas.ortools.version="${ORTOOLS_VERSION}" \
      io.umtas.base-image.update-policy="Track patched Node 22 bookworm-slim releases"

RUN apt-get update \
    && apt-get install --yes --no-install-recommends build-essential ca-certificates curl dumb-init pkg-config unzip \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/bin /app/lib /tmp/umtas-worker \
    && chown -R node:node /app /tmp/umtas-worker

WORKDIR /app
ENV NODE_ENV=production \
    LD_LIBRARY_PATH=/app/lib \
    SOLVER_CLI_COMMAND=/app/bin/solver-cli \
    WORKER_TEMP_ROOT=/tmp/umtas-worker

COPY --from=node-build --chown=node:node /deploy/ /app/
COPY --from=solver-build --chown=node:node /out/bin/solver-cli /app/bin/solver-cli
COPY --from=solver-build /out/lib/ /app/lib/
COPY --from=solver-build --chown=node:node /out/image-smoke-ok /app/.image-smoke-ok

USER node
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/dist/index.js"]
