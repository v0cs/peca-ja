const express = require("express");
const request = require("supertest");

// Mock do usuarioController
jest.mock("../../../src/controllers/usuarioController", () => ({
  updateProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteAccount: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock do middleware
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "cliente" };
    next();
  }),
}));

describe("Routes - usuarioRoutes.js", () => {
  let app;
  let usuarioRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    usuarioRoutes = require("../../../src/routes/usuarioRoutes");
    app.use("/api/usuarios", usuarioRoutes);
  });

  describe("PUT /api/usuarios/profile", () => {
    it("deve montar rota de atualização de perfil do usuário", async () => {
      const usuarioController = require("../../../src/controllers/usuarioController");
      const response = await request(app)
        .put("/api/usuarios/profile")
        .set("Authorization", "Bearer valid-token")
        .send({ email: "novo@email.com" });

      expect(response.status).toBe(200);
      expect(usuarioController.updateProfile).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/usuarios/profile", () => {
    it("deve montar rota de exclusão de conta", async () => {
      const usuarioController = require("../../../src/controllers/usuarioController");
      const response = await request(app)
        .delete("/api/usuarios/profile")
        .set("Authorization", "Bearer valid-token")
        .send({ confirmacao: "EXCLUIR", senha: "123456" });

      expect(response.status).toBe(200);
      expect(usuarioController.deleteAccount).toHaveBeenCalled();
    });
  });
});

