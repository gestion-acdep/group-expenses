FROM node:20-slim

WORKDIR /usr/src/app

# Copiar archivos de la raíz
COPY package.json package-lock.json* ./

# Copiar solo server para cache de layer (opcional)
COPY server/package.json server/

# Instalar dependencias en la raíz
RUN npm install

# Copiar todo el server
COPY server/ server/

# Build del server
RUN npm run --workspace=server build

# Exponer puerto
EXPOSE 4050

# CMD
CMD ["npm", "run", "--workspace=server", "start"]
