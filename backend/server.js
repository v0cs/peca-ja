const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

// Importar configuração do banco de dados
const { sequelize } = require("./src/config/database");

// Importar rotas de autenticação
const authRoutes = require("./src/routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

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
  console.log(`   GET  /api/health`);
  console.log(`   GET  /health`);
});
