# --- Imagem Base ---
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências limpas
RUN npm ci

# Copiar os arquivos da aplicação
COPY . .

# Argumento e variável de ambiente necessária para compilar variáveis públicas
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Variável de ambiente adicional (opcional, para dev bypass de admins)
ARG NEXT_PUBLIC_ADMIN_UI_BYPASS=true
ENV NEXT_PUBLIC_ADMIN_UI_BYPASS=$NEXT_PUBLIC_ADMIN_UI_BYPASS

# Gerar o build otimizado de produção do Next.js
RUN npm run build

# Expor a porta padrão do Next.js
EXPOSE 3000

# Rodar o servidor do Next.js em produção
CMD ["npm", "start"]
