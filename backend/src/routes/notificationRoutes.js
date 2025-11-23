const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware");

/**
 * Rotas de Notificações
 * Base: /api/notificacoes
 *
 * Todas as rotas requerem autenticação
 */

/**
 * @route   GET /api/notificacoes
 * @desc    Listar notificações do usuário com paginação e filtros
 * @access  Private (qualquer usuário autenticado)
 * @query   page - Número da página (padrão: 1)
 * @query   limit - Limite por página (padrão: 20)
 * @query   tipo - Filtrar por tipo de notificação (opcional)
 * @query   lida - Filtrar por lida true/false (opcional)
 */
router.get("/", authMiddleware, NotificationController.listarNotificacoes);

/**
 * @route   GET /api/notificacoes/nao-lidas/contagem
 * @desc    Contar notificações não lidas
 * @access  Private (qualquer usuário autenticado)
 */
router.get(
  "/nao-lidas/contagem",
  authMiddleware,
  NotificationController.contarNaoLidas
);

/**
 * @route   GET /api/notificacoes/:id
 * @desc    Buscar notificação por ID
 * @access  Private (apenas dono da notificação)
 */
router.get("/:id", authMiddleware, NotificationController.buscarPorId);

/**
 * @route   PUT /api/notificacoes/:id/ler
 * @desc    Marcar notificação como lida
 * @access  Private (apenas dono da notificação)
 */
router.put("/:id/ler", authMiddleware, NotificationController.marcarComoLida);

/**
 * @route   PUT /api/notificacoes/ler-todas
 * @desc    Marcar todas as notificações como lidas
 * @access  Private (qualquer usuário autenticado)
 */
router.put(
  "/ler-todas",
  authMiddleware,
  NotificationController.marcarTodasComoLidas
);

/**
 * @route   DELETE /api/notificacoes/lidas
 * @desc    Deletar todas as notificações lidas
 * @access  Private (qualquer usuário autenticado)
 */
router.delete(
  "/lidas",
  authMiddleware,
  NotificationController.deletarTodasLidas
);

/**
 * @route   DELETE /api/notificacoes/:id
 * @desc    Deletar notificação
 * @access  Private (apenas dono da notificação)
 */
router.delete(
  "/:id",
  authMiddleware,
  NotificationController.deletarNotificacao
);

module.exports = router;
