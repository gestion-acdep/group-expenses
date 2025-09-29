FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY server/package.json server/pnpm-lock.yaml* ./
RUN apk add --no-cache curl python3 make g++ \
  && corepack enable \
  && pnpm install --frozen-lockfile --prod --silent \
  && apk del curl python3 make g++ || true

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY server/ .
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
EXPOSE 4050
CMD ["node", "dist/index.js"]
