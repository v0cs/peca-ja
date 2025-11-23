const express = require("express");
const request = require("supertest");

// Mock do notificationController
jest.mock("../../../src/controllers/notificationController", () => ({
  listarNotificacoes: jest.fn((req, res) => res.status(200).json({ success: true })),
  contarNaoLidas: jest.fn((req, res) => res.status(200).json({ success: true })),
  buscarPorId: jest.fn((req, res) => res.status(200).json({ success: true })),
  marcarComoLida: jest.fn((req, res) => res.status(200).json({ success: true })),
  marcarTodasComoLidas: jest.fn((req, res) => res.status(200).json({ success: true })),
  deletarTodasLidas: jest.fn((req, res) => res.status(200).json({ success: true })),
  deletarNotificacao: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock do middleware
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "cliente" };
    next();
  }),
}));

describe("Routes - notificationRoutes.js", () => {
  let app;
  let notificationRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    notificationRoutes = require("../../../src/routes/notificationRoutes");
    app.use("/api/notificacoes", notificationRoutes);
  });

  describe("GET /api/notificacoes", () => {
    it("deve montar rota de listagem de notificações", async () => {
      const notificationController = require("../../../src/controllers/notificationController");
      const response = await request(app)
        .get("/api/notificacoes")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(notificationController.listarNotificacoes).toHaveBeenCalled();
    });
  });

  describe("GET /api/notificacoes/nao-lidas/contagem", () => {
    it("deve montar rota de contar notificações não lidas", async () => {
      const notificationController = require("../../../src/controllers/notificationController");
      const response = await request(app)
        .get("/api/notificacoes/nao-lidas/contagem")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(notificationController.contarNaoLidas).toHaveBeenCalled();
    });
  });

  describe("PUT /api/notificacoes/:id/ler", () => {
    it("deve montar rota de marcar notificação como lida", async () => {
      const notificationController = require("../../../src/controllers/notificationController");
      const response = await request(app)
        .put("/api/notificacoes/1/ler")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(notificationController.marcarComoLida).toHaveBeenCalled();
    });
  });

  describe("PUT /api/notificacoes/ler-todas", () => {
    it("deve montar rota de marcar todas as notificações como lidas", async () => {
      const notificationController = require("../../../src/controllers/notificationController");
      const response = await request(app)
        .put("/api/notificacoes/ler-todas")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(notificationController.marcarTodasComoLidas).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/notificacoes/:id", () => {
    it("deve montar rota de excluir notificação", async () => {
      const notificationController = require("../../../src/controllers/notificationController");
      const response = await request(app)
        .delete("/api/notificacoes/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(notificationController.deletarNotificacao).toHaveBeenCalled();
    });
  });
});

