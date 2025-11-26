FROM node:18-alpine
WORKDIR /app

# Copiar arquivos de dependências primeiro
COPY package*.json ./

# Criar script de entrypoint inline para evitar problemas com line endings
RUN echo '#!/bin/sh' > /usr/local/bin/docker-entrypoint.sh && \
    echo 'set -e' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '  echo "📦 Instalando dependências..."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '  npm install' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'fi' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'exec "$@"' >> /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Instalar dependências durante o build
RUN npm install

# Copiar resto dos arquivos
COPY . .

EXPOSE 3001
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]