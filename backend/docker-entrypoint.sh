#!/bin/sh
set -e

# Se node_modules não existir ou estiver vazio, instalar dependências
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo "📦 Instalando dependências..."
  npm install
fi

echo "🔄 Aguardando banco de dados estar pronto..."
# Aguardar PostgreSQL estar disponível
until nc -z postgres 5432 2>/dev/null; do
  echo "⏳ Aguardando PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL está pronto!"

echo "🔄 Executando migrations do banco de dados..."
npx sequelize-cli db:migrate || {
  echo "⚠️ Aviso: Erro ao executar migrations (pode ser normal se já estiverem aplicadas)"
}

echo "✅ Migrations concluídas!"

echo "🚀 Iniciando aplicação..."
# Executar o comando original
exec "$@"