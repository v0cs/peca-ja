const express = require("express");
const router = express.Router();
const autopecaController = require("../controllers/autopecaController");
const { authMiddleware } = require("../middleware");

/**
 * Middleware para verificar se o usuário é do tipo autopeca
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const autopecaMiddleware = (req, res, next) => {
  const { tipo } = req.user;

  if (tipo !== "autopeca") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado",
      errors: {
        tipo_usuario: "Esta operação é exclusiva para autopeças",
      },
    });
  }

  next();
};

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Todas as rotas requerem que o usuário seja do tipo autopeca
router.use(autopecaMiddleware);

// Rota para buscar perfil da autopeça logada
router.get("/profile", autopecaController.getProfile);

// Rota para atualizar perfil da autopeça
router.put("/profile", autopecaController.updateProfile);

// Rota para listar solicitações disponíveis na mesma cidade
router.get(
  "/solicitacoes-disponiveis",
  autopecaController.getSolicitacoesDisponiveis
);

// Rota para marcar solicitação como atendida
router.post(
  "/solicitacoes/:solicitacaoId/atender",
  autopecaController.marcarComoAtendida
);

module.exports = router;
