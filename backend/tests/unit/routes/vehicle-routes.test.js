const express = require("express");
const request = require("supertest");

// CRÍTICO: Mockar uploadMiddleware ANTES de qualquer coisa para evitar execução de código no nível do módulo
jest.mock("../../../src/middleware/uploadMiddleware", () => ({
  uploadMiddleware: jest.fn((req, res, next) => next()),
  uploadSingleMiddleware: jest.fn((req, res, next) => next()),
}));

// Mock dos controllers e middlewares
jest.mock("../../../src/controllers/vehicleController", () => ({
  consultarPlaca: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  obterEstatisticas: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  limparCache: jest.fn((req, res) => res.status(200).json({ success: true })),
  obterStatusCircuitBreaker: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  forcarAberturaCircuitBreaker: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  forcarFechamentoCircuitBreaker: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
  resetarMetricasCircuitBreaker: jest.fn((req, res) =>
    res.status(200).json({ success: true })
  ),
}));

// CRÍTICO: Mockar middleware/index.js COMPLETO para evitar que o Jest carregue uploadMiddleware.js
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "cliente" };
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

jest.mock("express-rate-limit", () => {
  return jest.fn(() => (req, res, next) => next());
});

jest.mock("../../../src/services/apiVeicularService", () => ({
  verificarConfiguracao: jest.fn(() => ({
    api_configured: true,
    cache_enabled: true,
    timeout: 10000,
  })),
}));

describe("Routes - vehicleRoutes.js", () => {
  let app;
  let vehicleRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    vehicleRoutes = require("../../../src/routes/vehicleRoutes");
    app.use("/api/vehicle", vehicleRoutes);
  });

  describe("GET /api/vehicle/consulta/:placa", () => {
    it("deve montar rota de consulta de placa com middlewares corretos", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const { authMiddleware } = require("../../../src/middleware");

      const response = await request(app).get("/api/vehicle/consulta/ABC1234");

      expect(response.status).toBe(200);
      expect(authMiddleware).toHaveBeenCalled();
      expect(VehicleController.consultarPlaca).toHaveBeenCalled();
    });

    it("deve validar formato de placa inválido", async () => {
      const response = await request(app).get("/api/vehicle/consulta/INVALID");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Formato de placa inválido",
        errors: expect.objectContaining({
          placa: expect.any(String),
        }),
      });
    });

    it("deve aceitar placa no formato antigo", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const response = await request(app).get("/api/vehicle/consulta/ABC-1234");

      expect(response.status).toBe(200);
      expect(VehicleController.consultarPlaca).toHaveBeenCalled();
    });

    it("deve aceitar placa no formato Mercosul", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const response = await request(app).get("/api/vehicle/consulta/ABC1D23");

      expect(response.status).toBe(200);
      expect(VehicleController.consultarPlaca).toHaveBeenCalled();
    });
  });

  describe("GET /api/vehicle/stats", () => {
    it("deve montar rota de estatísticas", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const { authMiddleware } = require("../../../src/middleware");

      const response = await request(app).get("/api/vehicle/stats");

      expect(response.status).toBe(200);
      expect(authMiddleware).toHaveBeenCalled();
      expect(VehicleController.obterEstatisticas).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/vehicle/cache", () => {
    it("deve montar rota de limpeza de cache", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const { authMiddleware } = require("../../../src/middleware");

      const response = await request(app).delete("/api/vehicle/cache");

      expect(response.status).toBe(200);
      expect(authMiddleware).toHaveBeenCalled();
      expect(VehicleController.limparCache).toHaveBeenCalled();
    });
  });

  describe("GET /api/vehicle/health", () => {
    it("deve retornar status healthy quando API está configurada", async () => {
      const apiVeicularService = require("../../../src/services/apiVeicularService");
      const response = await request(app).get("/api/vehicle/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "API veicular funcionando",
        data: {
          status: "healthy",
          configuracao: {
            api_configured: true,
            cache_enabled: true,
            timeout: 10000,
          },
          timestamp: expect.any(String),
        },
      });
    });

    it("deve retornar status 503 quando há erro na verificação", async () => {
      const apiVeicularService = require("../../../src/services/apiVeicularService");
      apiVeicularService.verificarConfiguracao.mockImplementationOnce(() => {
        throw new Error("Erro na configuração");
      });

      const response = await request(app).get("/api/vehicle/health");

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        success: false,
        message: "API veicular com problemas",
        errors: {
          motivo: "Erro na configuração",
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("GET /api/vehicle/circuit-breaker/status", () => {
    it("deve montar rota de status do circuit breaker", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const { authMiddleware } = require("../../../src/middleware");

      const response = await request(app).get(
        "/api/vehicle/circuit-breaker/status"
      );

      expect(response.status).toBe(200);
      expect(authMiddleware).toHaveBeenCalled();
      expect(VehicleController.obterStatusCircuitBreaker).toHaveBeenCalled();
    });
  });

  describe("POST /api/vehicle/circuit-breaker/open", () => {
    it("deve montar rota de forçar abertura do circuit breaker", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const { authMiddleware } = require("../../../src/middleware");

      const response = await request(app).post(
        "/api/vehicle/circuit-breaker/open"
      );

      expect(response.status).toBe(200);
      expect(authMiddleware).toHaveBeenCalled();
      expect(VehicleController.forcarAberturaCircuitBreaker).toHaveBeenCalled();
    });
  });

  describe("POST /api/vehicle/circuit-breaker/close", () => {
    it("deve montar rota de forçar fechamento do circuit breaker", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const { authMiddleware } = require("../../../src/middleware");

      const response = await request(app).post(
        "/api/vehicle/circuit-breaker/close"
      );

      expect(response.status).toBe(200);
      expect(authMiddleware).toHaveBeenCalled();
      expect(
        VehicleController.forcarFechamentoCircuitBreaker
      ).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/vehicle/circuit-breaker/metrics", () => {
    it("deve montar rota de resetar métricas do circuit breaker", async () => {
      const VehicleController = require("../../../src/controllers/vehicleController");
      const { authMiddleware } = require("../../../src/middleware");

      const response = await request(app).delete(
        "/api/vehicle/circuit-breaker/metrics"
      );

      expect(response.status).toBe(200);
      expect(authMiddleware).toHaveBeenCalled();
      expect(
        VehicleController.resetarMetricasCircuitBreaker
      ).toHaveBeenCalled();
    });
  });

  describe("GET /api/vehicle/docs", () => {
    it("deve retornar documentação da API", async () => {
      const response = await request(app).get("/api/vehicle/docs");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Documentação da API Veicular",
        data: {
          endpoints: expect.any(Object),
          formatos_resposta: expect.any(Object),
          exemplos: expect.any(Object),
        },
      });
    });
  });
});
