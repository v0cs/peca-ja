// Routes index file
// Export all routes from here

const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const solicitacaoRoutes = require("./solicitacaoRoutes");

// Health check da API
router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API do PeçaJá está funcionando!" });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/solicitacoes", solicitacaoRoutes);

module.exports = router;
