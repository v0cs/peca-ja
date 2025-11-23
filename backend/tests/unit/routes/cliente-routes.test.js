const express = require("express");
const request = require("supertest");

// Mock do clienteController
jest.mock("../../../src/controllers/clienteController", () => ({
  getProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock do middleware
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "cliente" };
    next();
  }),
}));

describe("Routes - clienteRoutes.js", () => {
  let app;
  let clienteRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    clienteRoutes = require("../../../src/routes/clienteRoutes");
    app.use("/api/clientes", clienteRoutes);
  });

  describe("Middleware clienteMiddleware", () => {
    it("deve bloquear acesso quando usuário não é cliente", async () => {
      const { authMiddleware } = require("../../../src/middleware");
      authMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = { userId: 1, tipo: "autopeca" };
        next();
      });

      const response = await request(app)
        .get("/api/clientes/profile")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para clientes",
        },
      });
    });

    it("deve permitir acesso quando usuário é cliente", async () => {
      const clienteController = require("../../../src/controllers/clienteController");
      const response = await request(app)
        .get("/api/clientes/profile")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(clienteController.getProfile).toHaveBeenCalled();
    });
  });

  describe("GET /api/clientes/profile", () => {
    it("deve montar rota de busca de perfil", async () => {
      const clienteController = require("../../../src/controllers/clienteController");
      const response = await request(app)
        .get("/api/clientes/profile")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(clienteController.getProfile).toHaveBeenCalled();
    });
  });

  describe("PUT /api/clientes/profile", () => {
    it("deve montar rota de atualização de perfil", async () => {
      const clienteController = require("../../../src/controllers/clienteController");
      const response = await request(app)
        .put("/api/clientes/profile")
        .set("Authorization", "Bearer valid-token")
        .send({ nome_completo: "Cliente Atualizado" });

      expect(response.status).toBe(200);
      expect(clienteController.updateProfile).toHaveBeenCalled();
    });
  });
});

