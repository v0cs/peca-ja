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
jest.mock("../../../src/controllers/vendedorOperacoesController", () => ({
  getProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  getDashboard: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSolicitacoesDisponiveis: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSolicitacoesVistas: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSolicitacoesAtendidas: jest.fn((req, res) => res.status(200).json({ success: true })),
  marcarComoVista: jest.fn((req, res) => res.status(200).json({ success: true })),
  desmarcarComoVista: jest.fn((req, res) => res.status(200).json({ success: true })),
  marcarComoAtendida: jest.fn((req, res) => res.status(200).json({ success: true })),
  desmarcarComoAtendida: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

// CRÍTICO: Mockar middleware/index.js COMPLETO para evitar que o Jest carregue uploadMiddleware.js
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "vendedor" };
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

describe("Routes - vendedorOperacoesRoutes.js", () => {
  let app;
  let vendedorOperacoesRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    vendedorOperacoesRoutes = require("../../../src/routes/vendedorOperacoesRoutes");
    app.use("/api/vendedor", vendedorOperacoesRoutes);
  });

  describe("Middleware vendedorMiddleware", () => {
    it("deve bloquear acesso quando usuário não é vendedor", async () => {
      const { authMiddleware } = require("../../../src/middleware");
      authMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = { userId: 1, tipo: "cliente" };
        next();
      });

      const response = await request(app).get("/api/vendedor/profile");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve permitir acesso quando usuário é vendedor", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).get("/api/vendedor/profile");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.getProfile).toHaveBeenCalled();
    });
  });

  describe("GET /api/vendedor/profile", () => {
    it("deve montar rota de busca de perfil", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).get("/api/vendedor/profile");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.getProfile).toHaveBeenCalled();
    });
  });

  describe("PUT /api/vendedor/profile", () => {
    it("deve montar rota de atualização de perfil", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app)
        .put("/api/vendedor/profile")
        .send({ nome: "Vendedor Atualizado" });

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.updateProfile).toHaveBeenCalled();
    });
  });

  describe("GET /api/vendedor/dashboard", () => {
    it("deve montar rota de dashboard", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).get("/api/vendedor/dashboard");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.getDashboard).toHaveBeenCalled();
    });
  });

  describe("GET /api/vendedor/solicitacoes-disponiveis", () => {
    it("deve montar rota de listagem de solicitações disponíveis", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).get("/api/vendedor/solicitacoes-disponiveis");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.getSolicitacoesDisponiveis).toHaveBeenCalled();
    });
  });

  describe("GET /api/vendedor/solicitacoes-vistas", () => {
    it("deve montar rota de listagem de solicitações vistas", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).get("/api/vendedor/solicitacoes-vistas");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.getSolicitacoesVistas).toHaveBeenCalled();
    });
  });

  describe("GET /api/vendedor/solicitacoes-atendidas", () => {
    it("deve montar rota de listagem de solicitações atendidas", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).get("/api/vendedor/solicitacoes-atendidas");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.getSolicitacoesAtendidas).toHaveBeenCalled();
    });
  });

  describe("POST /api/vendedor/solicitacoes/:solicitacaoId/marcar-vista", () => {
    it("deve montar rota de marcar como vista", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).post("/api/vendedor/solicitacoes/1/marcar-vista");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.marcarComoVista).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/vendedor/solicitacoes/:solicitacaoId/marcar-vista", () => {
    it("deve montar rota de desmarcar como vista", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).delete("/api/vendedor/solicitacoes/1/marcar-vista");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.desmarcarComoVista).toHaveBeenCalled();
    });
  });

  describe("POST /api/vendedor/solicitacoes/:solicitacaoId/atender", () => {
    it("deve montar rota de marcar como atendida", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).post("/api/vendedor/solicitacoes/1/atender");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.marcarComoAtendida).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/vendedor/solicitacoes/:solicitacaoId/atender", () => {
    it("deve montar rota de desmarcar como atendida", async () => {
      const vendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
      const response = await request(app).delete("/api/vendedor/solicitacoes/1/atender");

      expect(response.status).toBe(200);
      expect(vendedorOperacoesController.desmarcarComoAtendida).toHaveBeenCalled();
    });
  });
});

