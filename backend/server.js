const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Importar configuração centralizada
const config = require("./src/config/env");

// Importar conexão do banco de dados
const { sequelize } = require("./src/config/database");

// Importar rotas de autenticação
const authRoutes = require("./src/routes/authRoutes");

const app = express();
const PORT = config.PORT;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json()); // ESSENCIAL para parsing de JSON

// Configurar rotas
app.use("/api/auth", authRoutes);

// Rotas de health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "API do PeçaJá está funcionando!" });
});

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
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /health`);

  // Debug de configuração (opcional - pode remover depois)
  console.log("=== CONFIGURAÇÃO CARREGADA ===");
  console.log("NODE_ENV:", config.NODE_ENV);
  console.log("DB_HOST:", config.DB_HOST);
  console.log(
    "JWT_SECRET:",
    config.JWT_SECRET ? "✅ Configurado" : "❌ Não configurado"
  );
});
