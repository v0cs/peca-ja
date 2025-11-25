#!/bin/sh
set -e

# Se node_modules não existir ou estiver vazio, instalar dependências
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo "📦 Instalando dependências..."
  npm install
fi

# Executar o comando original
exec "$@"

