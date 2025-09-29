FROM node:20-slim

WORKDIR /usr/src/app

# Instalar pnpm
RUN npm install -g pnpm@10

# Copiar archivos de la raíz (package.json, pnpm-workspace.yaml, lockfile)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copiar solo server para cache de layer (opcional)
COPY server/package.json server/

# Instalar dependencias en la raíz
RUN pnpm install

# Copiar todo el server
COPY server/ server/

# Build del server
RUN pnpm -C server build

# Exponer puerto
EXPOSE 4050

# CMD
CMD ["pnpm", "-C", "server", "start"]
