FROM node:26-alpine AS base
RUN npm install -g pnpm@10.33.0

# ── Dependencies ──
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# ── Build ──
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ── Production ──
FROM node:26-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
