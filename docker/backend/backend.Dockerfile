FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/backend/ ./apps/backend/
RUN pnpm --filter=shared-types build
RUN pnpm --filter=backend build
RUN pnpm --filter=backend deploy --prod --legacy /deploy && cp -r apps/backend/dist /deploy/dist

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000
COPY --from=build /deploy .
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+process.env.PORT+'/health',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "dist/main"]
