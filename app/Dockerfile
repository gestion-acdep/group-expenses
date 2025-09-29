FROM node:20-slim

WORKDIR /usr/src/app

# Instalar pnpm
RUN npm install -g pnpm@10

# Copiar archivos de la raíz
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copiar solo app/package.json para cache
COPY app/package.json app/

# Instalar dependencias
RUN pnpm install

# Copiar toda la app
COPY app/ app/

# Build de la app
RUN pnpm -C app build

# Exponer puerto
EXPOSE 3000

# CMD
CMD ["pnpm", "-C", "app", "start"]
