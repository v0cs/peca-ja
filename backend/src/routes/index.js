// Routes index file
// Export all routes from here

const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const solicitacaoRoutes = require("./solicitacaoRoutes");
const vehicleRoutes = require("./vehicleRoutes");
const autopecaRoutes = require("./autopecaRoutes");
const clienteRoutes = require("./clienteRoutes");
const usuarioRoutes = require("./usuarioRoutes");
const vendedorRoutes = require("./vendedorRoutes");
const vendedorOperacoesRoutes = require("./vendedorOperacoesRoutes");
const notificationRoutes = require("./notificationRoutes");

// Import métricas Prometheus
const { getMetrics, register } = require("../utils/metrics");

// Health check da API
router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API do PeçaJá está funcionando!" });
});

// Endpoint de métricas Prometheus
router.get("/metrics", async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set("Content-Type", register.contentType);
    res.end(metrics);
  } catch (error) {
    console.error("❌ Erro ao obter métricas:", error);
    res
      .status(500)
      .set("Content-Type", "text/plain")
      .end(`Erro ao obter métricas: ${error.message}`);
  }
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/solicitacoes", solicitacaoRoutes);
router.use("/vehicle", vehicleRoutes);
router.use("/autopecas", autopecaRoutes);
router.use("/clientes", clienteRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/vendedores", vendedorRoutes);
router.use("/vendedor", vendedorOperacoesRoutes);
router.use("/notificacoes", notificationRoutes);

module.exports = router;
