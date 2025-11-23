const request = require("supertest");
const express = require("express");

// ⚠️ CRÍTICO: Mockar config/env ANTES de qualquer coisa para evitar acionar Babel
jest.mock("../../../src/config/env", () => ({
  NODE_ENV: "test",
  PORT: 3001,
  isProduction: false,
  DB_HOST: "localhost",
  DB_PORT: 5432,
  DB_NAME: "test_db",
  DB_USER: "test_user",
  DB_PASSWORD: "test_password",
  JWT_SECRET: "test-secret",
  JWT_EXPIRES_IN: "24h",
  RESEND_API_KEY: "test-key",
  emailFrom: "test@example.com",
  frontendURL: "http://localhost:3000",
  API_VEICULAR_KEY: "test-key",
  API_VEICULAR_EMAIL: "test@example.com",
  API_VEICULAR_BASE_URL: "https://api.test.com",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  GOOGLE_CALLBACK_URL: "http://localhost:3001/api/auth/google/callback",
}));

// ⚠️ CRÍTICO: Mockar passport ANTES de mockar rotas que o importam
jest.mock("../../../src/config/passport", () => ({
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

// ⚠️ CRÍTICO: Mockar middleware/index.js COMPLETO para evitar que o Jest carregue uploadMiddleware.js
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

// Mock das rotas para evitar carregar dependências complexas
// Apenas mockamos para permitir que o routes/index.js seja carregado
// Não testamos a montagem real, apenas o endpoint /health que é funcionalidade real
jest.mock("../../../src/routes/authRoutes", () => require("express").Router());
jest.mock("../../../src/routes/solicitacaoRoutes", () => require("express").Router());
jest.mock("../../../src/routes/vehicleRoutes", () => require("express").Router());
jest.mock("../../../src/routes/autopecaRoutes", () => require("express").Router());
jest.mock("../../../src/routes/clienteRoutes", () => require("express").Router());
jest.mock("../../../src/routes/usuarioRoutes", () => require("express").Router());
jest.mock("../../../src/routes/vendedorRoutes", () => require("express").Router());
jest.mock("../../../src/routes/vendedorOperacoesRoutes", () => require("express").Router());
jest.mock("../../../src/routes/notificationRoutes", () => require("express").Router());

const routes = require("../../../src/routes/index");

describe("Routes Index - Health Check", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use("/api", routes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/health", () => {
    it("deve retornar status 200 com mensagem de sucesso", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "OK",
        message: "API do PeçaJá está funcionando!",
      });
    });

    it("deve retornar Content-Type application/json", async () => {
      const response = await request(app).get("/api/health");

      expect(response.headers["content-type"]).toMatch(/json/);
    });
  });
});
