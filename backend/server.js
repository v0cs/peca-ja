const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Importar configuração centralizada
const config = require("./src/config/env");

// Importar conexão do banco de dados
const { sequelize } = require("./src/config/database");

// Importar todas as rotas organizadas
const routes = require("./src/routes");

const app = express();
const PORT = config.PORT;

// Middlewares
// Configurar helmet para permitir imagens de uploads
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json());

// Configurar todas as rotas com prefixo /api
app.use("/api", routes);

// Servir arquivos estáticos da pasta uploads (caminho absoluto)
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));
console.log(`📁 Servindo arquivos estáticos de: ${uploadsDir}`);

// Health check básico
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend simplificado funcionando!" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo deu errado!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Inicialização do servidor
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com PostgreSQL estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar com PostgreSQL:", error.message);
  }

  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   POST /api/solicitacoes`);
  console.log(`   GET  /api/solicitacoes`);
  console.log(`   GET  /api/solicitacoes/:id`);
  console.log(`   PUT  /api/solicitacoes/:id`);
  console.log(`   DELETE /api/solicitacoes/:id`);
  console.log(`   GET  /health`);
});
