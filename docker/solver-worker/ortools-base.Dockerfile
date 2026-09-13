# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE}
ARG TARGETARCH
ARG ORTOOLS_VERSION=9.12.4544

LABEL org.opencontainers.image.title="UMTAS OR-Tools build base" \
      org.opencontainers.image.description="Pinned OR-Tools toolchain for the UMTAS solver worker" \
      org.opencontainers.image.source="https://github.com/Vigilant-Computation/UMTAS" \
      io.umtas.ortools.version="${ORTOOLS_VERSION}"

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
    && apt-get install --yes --no-install-recommends build-essential ca-certificates curl pkg-config unzip \
    && rm -rf /var/lib/apt/lists/* \
    && curl --fail --location --retry 3 "${ORTOOLS_URL}" --output /tmp/ortools.tar.gz \
    && echo "${ORTOOLS_SHA256}  /tmp/ortools.tar.gz" | sha256sum --check --strict \
    && mkdir -p /opt/ortools \
    && tar --extract --gzip --file /tmp/ortools.tar.gz --directory /opt/ortools --strip-components=1 \
    && test -f "/opt/ortools/lib/libortools.so.${ORTOOLS_VERSION}" \
    && rm /tmp/ortools.tar.gz

ENV LD_LIBRARY_PATH=/opt/ortools/lib
