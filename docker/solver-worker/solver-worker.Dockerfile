# syntax=docker/dockerfile:1.7

# Deliberate base-image policy: track patched Node 22/bookworm-slim releases and
# rebuild through the normal dependency/image scanning pipeline.
ARG NODE_IMAGE=node:22-bookworm-slim

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

# OR-Tools archives and checksums are pinned for both supported Linux architectures.
# Each archive contains pinned Protobuf, Abseil and transitive shared libraries;
# openGA and nlohmann/json are the pinned, vendored headers in preference-solver/lib.
FROM node-base AS solver-build
ARG TARGETARCH
ARG ORTOOLS_VERSION=9.12.4544
RUN set -ex; \
    case "${TARGETARCH}" in \
      arm64) \
        ORTOOLS_SHA256="7aa7187626887125563993131cf49960939fceaa0ce843e2c7be03fc190d86db"; \
        ORTOOLS_URL="https://github.com/google/or-tools/releases/download/v9.12/or-tools_arm64_debian-11_cpp_v9.12.4544.tar.gz" \
        ;; \
      amd64) \
        ORTOOLS_SHA256="cb42ea7d7799a01fea7cdaafacbdfc67180d85f39532c6d2a8c4cfb419bd07ed"; \
        ORTOOLS_URL="https://github.com/google/or-tools/releases/download/v9.12/or-tools_amd64_ubuntu-22.04_cpp_v9.12.4544.tar.gz" \
        ;; \
      *) echo "Unsupported TARGETARCH: ${TARGETARCH}. Supported: amd64, arm64" >&2; exit 64 ;; \
    esac; \
    apt-get update \
    && apt-get install --yes --no-install-recommends build-essential ca-certificates curl pkg-config \
    && rm -rf /var/lib/apt/lists/* \
    && curl --fail --location --retry 3 "${ORTOOLS_URL}" --output /tmp/ortools.tar.gz \
    && echo "${ORTOOLS_SHA256}  /tmp/ortools.tar.gz" | sha256sum --check --strict \
    && mkdir -p /opt/ortools \
    && tar --extract --gzip --file /tmp/ortools.tar.gz --directory /opt/ortools --strip-components=1 \
    && test -f "/opt/ortools/lib/libortools.so.${ORTOOLS_VERSION}" \
    && rm /tmp/ortools.tar.gz

COPY apps/preference-solver /workspace/apps/preference-solver
WORKDIR /workspace/apps/preference-solver
ENV LD_LIBRARY_PATH=/opt/ortools/lib
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
LABEL org.opencontainers.image.title="UMTAS solver worker" \
      org.opencontainers.image.description="BullMQ worker for timetable optimization" \
      org.opencontainers.image.source="https://github.com/Vigilant-Computation/UMTAS" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.base.name="docker.io/library/node:22-bookworm-slim" \
      org.opencontainers.image.vendor="Vigilant Computation" \
      io.umtas.ortools.version="9.12.4544" \
      io.umtas.base-image.update-policy="Track patched Node 22 bookworm-slim releases"

RUN apt-get update \
    && apt-get install --yes --no-install-recommends dumb-init libgomp1 curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/bin /app/lib /tmp/umtas-worker \
    && chown -R node:node /app /tmp/umtas-worker

WORKDIR /app
ENV NODE_ENV=production \
    LD_LIBRARY_PATH=/app/lib \
    SOLVER_CLI_COMMAND=/app/bin/solver-cli \
    WORKER_TEMP_ROOT=/tmp/umtas-worker \
    HEALTH_PORT_SOLVER_WORKER=8081

EXPOSE 8081

COPY --from=node-build --chown=node:node /deploy/ /app/
COPY --from=solver-build --chown=node:node /out/bin/solver-cli /app/bin/solver-cli
COPY --from=solver-build /out/lib/ /app/lib/
COPY --from=solver-build --chown=node:node /out/image-smoke-ok /app/.image-smoke-ok

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

USER node
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/dist/index.js"]
