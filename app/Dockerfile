FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY app/package.json app/pnpm-lock.yaml* ./
RUN apk add --no-cache curl python3 make g++ \
  && corepack enable \
  && pnpm install --frozen-lockfile --prod --silent \
  && apk del curl python3 make g++ || true

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY app/ .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
EXPOSE 3000
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
CMD ["pnpm", "start", "-p", "3000"]
