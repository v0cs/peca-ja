// Mock do Resend ANTES de qualquer require
jest.mock("resend", () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

// Mock do config/env ANTES de qualquer require
jest.mock("../../../src/config/env", () => ({
  RESEND_API_KEY: "test-api-key",
  emailFrom: "test@example.com",
  frontendURL: "http://localhost:3000",
  NODE_ENV: "test",
  PORT: 3001,
  isProduction: false,
}));

const middleware = require("../../../src/middleware");

describe("Middleware Index", () => {
  it("deve exportar todos os middlewares necessários", () => {
    const expectedMiddlewares = [
      "authMiddleware",
      "uploadMiddleware",
      "uploadSingleMiddleware",
      "consultaVeicularMiddleware",
      "consultaVeicularSolicitacoesMiddleware",
      "logConsultaVeicularMiddleware",
      "generalRateLimiter",
      "authRateLimiter",
      "apiRateLimiter",
      "uploadRateLimiter",
      "solicitationRateLimiter",
      "vendedorCreationRateLimiter",
    ];

    expectedMiddlewares.forEach((middlewareName) => {
      expect(middleware).toHaveProperty(middlewareName);
      expect(middleware[middlewareName]).toBeDefined();
    });
  });

  it("deve exportar authMiddleware", () => {
    expect(middleware.authMiddleware).toBeDefined();
  });

  it("deve exportar uploadMiddleware", () => {
    expect(middleware.uploadMiddleware).toBeDefined();
  });

  it("deve exportar uploadSingleMiddleware", () => {
    expect(middleware.uploadSingleMiddleware).toBeDefined();
  });

  it("deve exportar consultaVeicularMiddleware", () => {
    expect(middleware.consultaVeicularMiddleware).toBeDefined();
  });

  it("deve exportar consultaVeicularSolicitacoesMiddleware", () => {
    expect(middleware.consultaVeicularSolicitacoesMiddleware).toBeDefined();
  });

  it("deve exportar logConsultaVeicularMiddleware", () => {
    expect(middleware.logConsultaVeicularMiddleware).toBeDefined();
  });

  it("deve exportar generalRateLimiter", () => {
    expect(middleware.generalRateLimiter).toBeDefined();
  });

  it("deve exportar authRateLimiter", () => {
    expect(middleware.authRateLimiter).toBeDefined();
  });

  it("deve exportar apiRateLimiter", () => {
    expect(middleware.apiRateLimiter).toBeDefined();
  });

  it("deve exportar uploadRateLimiter", () => {
    expect(middleware.uploadRateLimiter).toBeDefined();
  });

  it("deve exportar solicitationRateLimiter", () => {
    expect(middleware.solicitationRateLimiter).toBeDefined();
  });

  it("deve exportar vendedorCreationRateLimiter", () => {
    expect(middleware.vendedorCreationRateLimiter).toBeDefined();
  });
});

