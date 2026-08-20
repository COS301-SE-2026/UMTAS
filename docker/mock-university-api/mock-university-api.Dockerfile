FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@10.33.2 --activate

COPY pnpm-workspace.yaml ./
COPY apps/mock-university-api/package.json ./

RUN pnpm install

COPY apps/mock-university-api/ .

RUN pnpm build


FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3010

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3010

USER node

CMD ["node", "dist/main.js"]