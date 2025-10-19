const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const { authMiddleware } = require("../middleware");

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * Rota para atualizar dados gerais do usuário (email, senha)
 * PUT /api/usuarios/profile
 *
 * Body esperado:
 * {
 *   "email": "novo@email.com", // opcional
 *   "senha_atual": "senha123", // obrigatório se nova_senha for fornecida
 *   "nova_senha": "novaSenha123" // opcional
 * }
 */
router.put("/profile", usuarioController.updateProfile);

/**
 * Rota para excluir conta do usuário (soft delete)
 * DELETE /api/usuarios/profile
 *
 * Body esperado:
 * {
 *   "confirmacao": "EXCLUIR", // obrigatório (texto exato)
 *   "senha": "senha123" // obrigatório
 * }
 */
router.delete("/profile", usuarioController.deleteAccount);

module.exports = router;
