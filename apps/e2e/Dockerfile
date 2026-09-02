FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/e2e/package.json ./apps/e2e/package.json
RUN pnpm install --frozen-lockfile --filter e2e... \
    --network-concurrency=8 --fetch-retries=5 --fetch-timeout=60000

    RUN npx playwright install-deps firefox webkit
    
COPY apps/e2e ./apps/e2e

WORKDIR /workspace/apps/e2e
CMD ["pnpm", "test"]
