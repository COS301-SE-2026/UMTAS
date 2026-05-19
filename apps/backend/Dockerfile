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
RUN pnpm run build

# ── Production ──
FROM node:26-alpine AS production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle
COPY package.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
