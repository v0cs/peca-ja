const express = require("express");
const router = express.Router();
const solicitacaoController = require("../controllers/solicitacaoController");
const { authMiddleware } = require("../middleware");

// Todas as rotas de solicitações requerem autenticação
router.use(authMiddleware);

// POST /api/solicitacoes - Criar nova solicitação
router.post("/", solicitacaoController.create);

// GET /api/solicitacoes - Listar solicitações do usuário logado
router.get("/", solicitacaoController.list);

// GET /api/solicitacoes/:id - Buscar solicitação específica
router.get("/:id", solicitacaoController.getById);

// PUT /api/solicitacoes/:id - Atualizar solicitação
router.put("/:id", solicitacaoController.update);

// DELETE /api/solicitacoes/:id - Cancelar solicitação
router.delete("/:id", solicitacaoController.cancel);

module.exports = router;
