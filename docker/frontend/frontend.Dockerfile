FROM rust:slim AS rust-builder
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    build-essential \
    libxcb1 \
    libgl1 \
    libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
WORKDIR /app

RUN pip3 install --no-cache-dir ultralytics onnx onnxruntime --break-system-packages && \
    mkdir -p /app/models-output && \
    python3 -c "from ultralytics import YOLO; model = YOLO('yolov11n.pt'); model.export(format='onnx', imgsz=640)" && \
    mv yolov11n.onnx /app/models-output/yolov11n.onnx

COPY apps/frontend/wasm-engine ./wasm-engine
WORKDIR /app/wasm-engine

RUN rustup target add wasm32-unknown-unknown
RUN wasm-pack build --target web --release

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm install --frozen-lockfile --filter frontend... \
    --network-concurrency=8 --fetch-retries=5 --fetch-timeout=60000

FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ARG API_URL
ARG COOKIE_SECURE
ARG NEXT_PUBLIC_POSTHOG_PT
ARG NEXT_PUBLIC_POSTHOG_API_HOST
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_MAP_KEY
ARG NEXT_PUBLIC_MAP_ID

ENV NEXT_PUBLIC_MAP_ID=${NEXT_PUBLIC_MAP_ID}
ENV NEXT_PUBLIC_MAP_KEY=${NEXT_PUBLIC_MAP_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV API_URL=${API_URL}
ENV COOKIE_SECURE=${COOKIE_SECURE}
ENV NEXT_PUBLIC_POSTHOG_PT=${NEXT_PUBLIC_POSTHOG_PT}
ENV NEXT_PUBLIC_POSTHOG_API_HOST=${NEXT_PUBLIC_POSTHOG_API_HOST}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}


COPY packages/shared-types/ ./packages/shared-types/
COPY apps/frontend/ ./apps/frontend/

# rust stuff
COPY --from=rust-builder /app/wasm-engine/pkg ./apps/frontend/wasm-engine/pkg
COPY --from=rust-builder /app/models-output/yolov11n.onnx ./apps/frontend/public/models/yolov11n.onnx


RUN pnpm --filter=shared-types build
RUN pnpm --filter=frontend build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /app/apps/frontend/public ./apps/frontend/public
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:'+process.env.PORT+'/login',r=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))"]
CMD ["node", "apps/frontend/server.js"]
