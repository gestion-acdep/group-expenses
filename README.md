# Group Expenses Monorepo

This repository is organized as a npm monorepo with two workspaces:

- app: Next.js frontend (moved from the original repo)
- server: Node.js TypeScript backend (scaffolded)

## Prerequisites

- npm installed

## Install

Run at the repo root:

- npm install

## Develop

- Frontend: npm run app:dev (or npm run --workspace=app dev)
- Backend: npm run server:dev (or npm run --workspace=server dev)

## Docker (compose)

Hay un `docker-compose.yml` en la raíz que levanta el `server` primero (con healthcheck) y luego el `app`.

Levantar en modo desarrollo/producción (reconstruye imágenes):

```bash
docker compose up --build
```

El `server` quedará expuesto en el host en `http://localhost:4050` y el `app` en `http://localhost:10000`.


## Build

- npm run build
- Start frontend: npm run --workspace=app start
- Start backend: npm run --workspace=server start

## Structure

- app/: Next.js app, components, lib, styles, public
- server/: minimal TypeScript Node server

You can add shared packages later (e.g., packages/shared) and reference them from both app and server.# group-expenses