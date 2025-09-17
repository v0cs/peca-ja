// backend/server-simple.js (temporário)
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Rota de health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend simplificado funcionando!" });
});

// Rota de teste
app.get("/api/test", (req, res) => {
  res.json({ message: "API teste funcionando!" });
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});