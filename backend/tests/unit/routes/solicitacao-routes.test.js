const express = require("express");
const request = require("supertest");

// Mock do uploadMiddleware
jest.mock("../../../src/middleware/uploadMiddleware", () => ({
  uploadMiddleware: jest.fn((req, res, next) => next()),
}));

// Mock do solicitacaoController
jest.mock("../../../src/controllers/solicitacaoController", () => ({
  create: jest.fn((req, res) => res.status(200).json({ success: true })),
  list: jest.fn((req, res) => res.status(200).json({ success: true })),
  getById: jest.fn((req, res) => res.status(200).json({ success: true })),
  update: jest.fn((req, res) => res.status(200).json({ success: true })),
  cancel: jest.fn((req, res) => res.status(200).json({ success: true })),
  adicionarImagens: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock do middleware
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "cliente" };
    next();
  }),
  consultaVeicularSolicitacoesMiddleware: jest.fn((req, res, next) => next()),
  logConsultaVeicularMiddleware: jest.fn((req, res, next) => next()),
  solicitationRateLimiter: jest.fn((req, res, next) => next()),
  uploadRateLimiter: jest.fn((req, res, next) => next()),
}));

describe("Routes - solicitacaoRoutes.js", () => {
  let app;
  let solicitacaoRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    solicitacaoRoutes = require("../../../src/routes/solicitacaoRoutes");
    app.use("/api/solicitacoes", solicitacaoRoutes);
  });

  describe("POST /api/solicitacoes", () => {
    it("deve montar rota de criação de solicitação", async () => {
      const solicitacaoController = require("../../../src/controllers/solicitacaoController");
      const response = await request(app)
        .post("/api/solicitacoes")
        .set("Authorization", "Bearer valid-token")
        .send({ descricao: "Teste" });

      expect(response.status).toBe(200);
      expect(solicitacaoController.create).toHaveBeenCalled();
    });
  });

  describe("GET /api/solicitacoes", () => {
    it("deve montar rota de listagem de solicitações", async () => {
      const solicitacaoController = require("../../../src/controllers/solicitacaoController");
      const response = await request(app)
        .get("/api/solicitacoes")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(solicitacaoController.list).toHaveBeenCalled();
    });
  });

  describe("GET /api/solicitacoes/:id", () => {
    it("deve montar rota de busca de solicitação por ID", async () => {
      const solicitacaoController = require("../../../src/controllers/solicitacaoController");
      const response = await request(app)
        .get("/api/solicitacoes/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(solicitacaoController.getById).toHaveBeenCalled();
    });
  });

  describe("PUT /api/solicitacoes/:id", () => {
    it("deve montar rota de atualização de solicitação", async () => {
      const solicitacaoController = require("../../../src/controllers/solicitacaoController");
      const response = await request(app)
        .put("/api/solicitacoes/1")
        .set("Authorization", "Bearer valid-token")
        .send({ descricao: "Atualizado" });

      expect(response.status).toBe(200);
      expect(solicitacaoController.update).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/solicitacoes/:id", () => {
    it("deve montar rota de cancelamento de solicitação", async () => {
      const solicitacaoController = require("../../../src/controllers/solicitacaoController");
      const response = await request(app)
        .delete("/api/solicitacoes/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(solicitacaoController.cancel).toHaveBeenCalled();
    });
  });
});

