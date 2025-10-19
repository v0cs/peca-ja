const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const { authMiddleware } = require("../middleware");

/**
 * Middleware para verificar se o usuário é do tipo cliente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const clienteMiddleware = (req, res, next) => {
  const { tipo } = req.user;

  if (tipo !== "cliente") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado",
      errors: {
        tipo_usuario: "Esta operação é exclusiva para clientes",
      },
    });
  }

  next();
};

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Todas as rotas requerem que o usuário seja do tipo cliente
router.use(clienteMiddleware);

// Rota para buscar perfil do cliente logado
router.get("/profile", clienteController.getProfile);

// Rota para atualizar perfil do cliente
router.put("/profile", clienteController.updateProfile);

module.exports = router;
