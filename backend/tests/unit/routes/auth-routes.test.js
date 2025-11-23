const express = require("express");
const request = require("supertest");

// Mock do passport
jest.mock("../../../src/config/passport", () => ({
  authenticate: jest.fn((strategy, options) => {
    return (req, res, next) => next();
  }),
}));

// Mock do authController
jest.mock("../../../src/controllers/authController", () => ({
  register: jest.fn((req, res) => res.status(200).json({ success: true })),
  registerAutopeca: jest.fn((req, res) => res.status(200).json({ success: true })),
  login: jest.fn((req, res) => res.status(200).json({ success: true })),
  forgotPassword: jest.fn((req, res) => res.status(200).json({ success: true })),
  resetPassword: jest.fn((req, res) => res.status(200).json({ success: true })),
  googleCallback: jest.fn((req, res) => res.status(200).json({ success: true })),
  me: jest.fn((req, res) => res.status(200).json({ success: true })),
  logout: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock do middleware
jest.mock("../../../src/middleware", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: 1, tipo: "cliente" };
    next();
  }),
  authRateLimiter: jest.fn((req, res, next) => next()),
}));

describe("Routes - authRoutes.js", () => {
  let app;
  let authRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    authRoutes = require("../../../src/routes/authRoutes");
    app.use("/api/auth", authRoutes);
  });

  describe("POST /api/auth/register", () => {
    it("deve montar rota de registro", async () => {
      const authController = require("../../../src/controllers/authController");
      const response = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@test.com", senha: "123456" });

      expect(response.status).toBe(200);
      expect(authController.register).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login", () => {
    it("deve montar rota de login", async () => {
      const authController = require("../../../src/controllers/authController");
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", senha: "123456" });

      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
    });
  });

  describe("GET /api/auth/me", () => {
    it("deve montar rota protegida para obter informações do usuário", async () => {
      const authController = require("../../../src/controllers/authController");
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(authController.me).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("deve montar rota protegida para logout", async () => {
      const authController = require("../../../src/controllers/authController");
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(authController.logout).toHaveBeenCalled();
    });
  });
});

