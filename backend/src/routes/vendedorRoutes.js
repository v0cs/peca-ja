const express = require("express");
const router = express.Router();
const vendedorController = require("../controllers/vendedorController");
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

// Rota para cadastrar novo vendedor
router.post("/", vendedorController.criarVendedor);

// Rota para listar vendedores da autopeça
router.get("/", vendedorController.listarVendedores);

// Rota para atualizar vendedor
router.put("/:vendedorId", vendedorController.atualizarVendedor);

// Rota para inativar vendedor
router.delete("/:vendedorId", vendedorController.inativarVendedor);

module.exports = router;
