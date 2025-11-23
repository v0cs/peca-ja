const express = require("express");
const request = require("supertest");

// CRÍTICO: Mockar uploadMiddleware ANTES de qualquer coisa para evitar execução de código no nível do módulo
jest.mock("../../../src/middleware/uploadMiddleware", () => ({
  uploadMiddleware: jest.fn((req, res, next) => next()),
  uploadSingleMiddleware: jest.fn((req, res, next) => next()),
}));

// Mock do apiVeicularService ANTES de qualquer require que possa usá-lo
jest.mock("../../../src/services", () => ({
  apiVeicularService: {
    consultarVeiculoPorPlaca: jest.fn(),
  },
}));

// Mock dos controllers e middlewares
jest.mock("../../../src/controllers/autopecaController", () => ({
  getProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSolicitacoesDisponiveis: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSolicitacoesAtendidas: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSolicitacoesVistas: jest.fn((req, res) => res.status(200).json({ success: true })),
  marcarComoAtendida: jest.fn((req, res) => res.status(200).json({ success: true })),
  desmarcarComoAtendida: jest.fn((req, res) => res.status(200).json({ success: true })),
  marcarComoLida: jest.fn((req, res) => res.status(200).json({ success: true })),
  desmarcarComoVista: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

// CRÍTICO: Mockar middleware/index.js COMPLETO para evitar que o Jest carregue uploadMiddleware.js
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "autopeca" };
    next();
  }),
  uploadMiddleware: jest.fn((req, res, next) => next()),
  uploadSingleMiddleware: jest.fn((req, res, next) => next()),
  consultaVeicularMiddleware: jest.fn((req, res, next) => next()),
  consultaVeicularSolicitacoesMiddleware: jest.fn((req, res, next) => next()),
  logConsultaVeicularMiddleware: jest.fn((req, res, next) => next()),
  generalRateLimiter: jest.fn((req, res, next) => next()),
  authRateLimiter: jest.fn((req, res, next) => next()),
  apiRateLimiter: jest.fn((req, res, next) => next()),
  uploadRateLimiter: jest.fn((req, res, next) => next()),
  solicitationRateLimiter: jest.fn((req, res, next) => next()),
  vendedorCreationRateLimiter: jest.fn((req, res, next) => next()),
}));

describe("Routes - autopecaRoutes.js", () => {
  let app;
  let autopecaRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    autopecaRoutes = require("../../../src/routes/autopecaRoutes");
    app.use("/api/autopecas", autopecaRoutes);
  });

  describe("Middleware autopecaMiddleware", () => {
    it("deve bloquear acesso quando usuário não é autopeca", async () => {
      const { authMiddleware } = require("../../../src/middleware");
      authMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = { userId: 1, tipo: "cliente" };
        next();
      });

      const response = await request(app).get("/api/autopecas/profile");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para autopeças",
        },
      });
    });

    it("deve permitir acesso quando usuário é autopeca", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).get("/api/autopecas/profile");

      expect(response.status).toBe(200);
      expect(autopecaController.getProfile).toHaveBeenCalled();
    });
  });

  describe("GET /api/autopecas/profile", () => {
    it("deve montar rota de busca de perfil", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).get("/api/autopecas/profile");

      expect(response.status).toBe(200);
      expect(autopecaController.getProfile).toHaveBeenCalled();
    });
  });

  describe("PUT /api/autopecas/profile", () => {
    it("deve montar rota de atualização de perfil", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app)
        .put("/api/autopecas/profile")
        .send({ razao_social: "Teste" });

      expect(response.status).toBe(200);
      expect(autopecaController.updateProfile).toHaveBeenCalled();
    });
  });

  describe("GET /api/autopecas/solicitacoes-disponiveis", () => {
    it("deve montar rota de listagem de solicitações disponíveis", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).get("/api/autopecas/solicitacoes-disponiveis");

      expect(response.status).toBe(200);
      expect(autopecaController.getSolicitacoesDisponiveis).toHaveBeenCalled();
    });
  });

  describe("GET /api/autopecas/solicitacoes-atendidas", () => {
    it("deve montar rota de listagem de solicitações atendidas", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).get("/api/autopecas/solicitacoes-atendidas");

      expect(response.status).toBe(200);
      expect(autopecaController.getSolicitacoesAtendidas).toHaveBeenCalled();
    });
  });

  describe("GET /api/autopecas/solicitacoes-vistas", () => {
    it("deve montar rota de listagem de solicitações vistas", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).get("/api/autopecas/solicitacoes-vistas");

      expect(response.status).toBe(200);
      expect(autopecaController.getSolicitacoesVistas).toHaveBeenCalled();
    });
  });

  describe("POST /api/autopecas/solicitacoes/:solicitacaoId/atender", () => {
    it("deve montar rota de marcar como atendida", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).post("/api/autopecas/solicitacoes/1/atender");

      expect(response.status).toBe(200);
      expect(autopecaController.marcarComoAtendida).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/autopecas/solicitacoes/:solicitacaoId/atender", () => {
    it("deve montar rota de desmarcar como atendida", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).delete("/api/autopecas/solicitacoes/1/atender");

      expect(response.status).toBe(200);
      expect(autopecaController.desmarcarComoAtendida).toHaveBeenCalled();
    });
  });

  describe("POST /api/autopecas/solicitacoes/:solicitacaoId/marcar-como-lida", () => {
    it("deve montar rota de marcar como lida", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).post("/api/autopecas/solicitacoes/1/marcar-como-lida");

      expect(response.status).toBe(200);
      expect(autopecaController.marcarComoLida).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/autopecas/solicitacoes/:solicitacaoId/marcar-como-lida", () => {
    it("deve montar rota de desmarcar como vista", async () => {
      const autopecaController = require("../../../src/controllers/autopecaController");
      const response = await request(app).delete("/api/autopecas/solicitacoes/1/marcar-como-lida");

      expect(response.status).toBe(200);
      expect(autopecaController.desmarcarComoVista).toHaveBeenCalled();
    });
  });
});

