FROM node:20-alpine
WORKDIR /app

# Copia manifests separadamente para aproveitar cache de camadas
COPY package*.json ./

# Instala dependências dentro da image (Linux Alpine)
RUN npm install

# Copia o restante do código (o .dockerignore bloqueia node_modules do host)
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
