# Group Expenses Monorepo

This repository is organized as a pnpm monorepo with two workspaces:

- app: Next.js frontend (moved from the original repo)
- server: Node.js TypeScript backend (scaffolded)

## Prerequisites

- pnpm installed

## Install

Run at the repo root:

- pnpm install

## Develop

- Frontend: pnpm app:dev (or pnpm -C app dev)
- Backend: pnpm server:dev (or pnpm -C server dev)

## Docker (compose)

Hay un `docker-compose.yml` en la raíz que levanta el `server` primero (con healthcheck) y luego el `app`.

Levantar en modo desarrollo/producción (reconstruye imágenes):

```bash
docker compose up --build
```

El `server` quedará expuesto en el host en `http://localhost:4050` y el `app` en `http://localhost:10000`.


## Build

- pnpm build
- Start frontend: pnpm -C app start
- Start backend: pnpm -C server start

## Structure

- app/: Next.js app, components, lib, styles, public
- server/: minimal TypeScript Node server

You can add shared packages later (e.g., packages/shared) and reference them from both app and server.# group-expenses