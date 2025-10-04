const express = require("express");
const router = express.Router();
const vendedorOperacoesController = require("../controllers/vendedorOperacoesController");
const { authMiddleware } = require("../middleware");

/**
 * Middleware para verificar se o usuário é do tipo vendedor
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const vendedorMiddleware = (req, res, next) => {
  const { tipo } = req.user;

  if (tipo !== "vendedor") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado",
      errors: {
        tipo_usuario: "Esta operação é exclusiva para vendedores",
      },
    });
  }

  next();
};

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Todas as rotas requerem que o usuário seja do tipo vendedor
router.use(vendedorMiddleware);

// Rota para dashboard do vendedor
router.get("/dashboard", vendedorOperacoesController.getDashboard);

// Rota para listar solicitações disponíveis para o vendedor
router.get(
  "/solicitacoes-disponiveis",
  vendedorOperacoesController.getSolicitacoesDisponiveis
);

// Rota para marcar solicitação como atendida pelo vendedor
router.post(
  "/solicitacoes/:solicitacaoId/atender",
  vendedorOperacoesController.marcarComoAtendida
);

module.exports = router;
