const express = require("express");
const request = require("supertest");

// Mock do vendedorController
jest.mock("../../../src/controllers/vendedorController", () => ({
  criarVendedor: jest.fn((req, res) => res.status(200).json({ success: true })),
  listarVendedores: jest.fn((req, res) => res.status(200).json({ success: true })),
  atualizarVendedor: jest.fn((req, res) => res.status(200).json({ success: true })),
  inativarVendedor: jest.fn((req, res) => res.status(200).json({ success: true })),
  reativarVendedor: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock do middleware
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "autopeca" };
    next();
  }),
  vendedorCreationRateLimiter: jest.fn((req, res, next) => next()),
}));

describe("Routes - vendedorRoutes.js", () => {
  let app;
  let vendedorRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    vendedorRoutes = require("../../../src/routes/vendedorRoutes");
    app.use("/api/vendedores", vendedorRoutes);
  });

  describe("Middleware autopecaMiddleware", () => {
    it("deve bloquear acesso quando usuário não é autopeca", async () => {
      const { authMiddleware } = require("../../../src/middleware");
      authMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = { userId: 1, tipo: "cliente" };
        next();
      });

      const response = await request(app)
        .get("/api/vendedores")
        .set("Authorization", "Bearer valid-token");

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
      const vendedorController = require("../../../src/controllers/vendedorController");
      const response = await request(app)
        .get("/api/vendedores")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(vendedorController.listarVendedores).toHaveBeenCalled();
    });
  });

  describe("POST /api/vendedores", () => {
    it("deve montar rota de criação de vendedor", async () => {
      const vendedorController = require("../../../src/controllers/vendedorController");
      const response = await request(app)
        .post("/api/vendedores")
        .set("Authorization", "Bearer valid-token")
        .send({ nome: "Vendedor Teste", email: "vendedor@test.com" });

      expect(response.status).toBe(200);
      expect(vendedorController.criarVendedor).toHaveBeenCalled();
    });
  });

  describe("GET /api/vendedores", () => {
    it("deve montar rota de listagem de vendedores", async () => {
      const vendedorController = require("../../../src/controllers/vendedorController");
      const response = await request(app)
        .get("/api/vendedores")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(vendedorController.listarVendedores).toHaveBeenCalled();
    });
  });

  describe("PUT /api/vendedores/:vendedorId", () => {
    it("deve montar rota de atualização de vendedor", async () => {
      const vendedorController = require("../../../src/controllers/vendedorController");
      const response = await request(app)
        .put("/api/vendedores/1")
        .set("Authorization", "Bearer valid-token")
        .send({ nome: "Vendedor Atualizado" });

      expect(response.status).toBe(200);
      expect(vendedorController.atualizarVendedor).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/vendedores/:vendedorId", () => {
    it("deve montar rota de inativação de vendedor", async () => {
      const vendedorController = require("../../../src/controllers/vendedorController");
      const response = await request(app)
        .delete("/api/vendedores/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(vendedorController.inativarVendedor).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/vendedores/:vendedorId/reativar", () => {
    it("deve montar rota de reativação de vendedor", async () => {
      const vendedorController = require("../../../src/controllers/vendedorController");
      const response = await request(app)
        .patch("/api/vendedores/1/reativar")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(vendedorController.reativarVendedor).toHaveBeenCalled();
    });
  });
});

