FROM node:22-bookworm-slim

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
RUN pnpm install --frozen-lockfile --filter backend...

COPY packages/shared-types ./packages/shared-types
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY apps/backend/drizzle ./apps/backend/drizzle
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/test/integration ./apps/backend/test/integration
COPY apps/backend/test/integration-runner ./apps/backend/test/integration-runner
COPY apps/pdf_parser/up_test_pdfs/CONFLICT_FALLBACK.pdf \
  ./apps/pdf_parser/up_test_pdfs/CONFLICT_FALLBACK.pdf
RUN pnpm --filter shared-types build
RUN pnpm --filter backend exec tsc \
  -p test/integration-runner/tsconfig.json --noEmit

WORKDIR /workspace/apps/backend
CMD ["pnpm", "exec", "jest", "--config=test/integration-runner/jest.config.ts", "--runInBand"]
