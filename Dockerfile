FROM node:20-slim

WORKDIR /usr/src/app

# Copiar archivos de la raíz
COPY package.json package-lock.json* ./

# Copiar solo app/package.json para cache
COPY app/package.json app/

# Instalar dependencias
RUN npm install

# Copiar toda la app
COPY app/ app/

# Build de la app
RUN npm run --workspace=app build

# Exponer puerto
EXPOSE 3000

# CMD
CMD ["npm", "run", "--workspace=app", "start"]
