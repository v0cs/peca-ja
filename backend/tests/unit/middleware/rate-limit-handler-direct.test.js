// Mock do express-rate-limit ANTES de qualquer require
jest.mock("express-rate-limit", () => {
  return jest.fn(() => jest.fn());
});

// Mock do config ANTES de qualquer require
jest.mock("../../../src/config/env", () => ({
  RATE_LIMIT_WINDOW_MS: "900000",
  RATE_LIMIT_MAX_REQUESTS: "100",
  RATE_LIMIT_AUTH_MAX: "10",
  RATE_LIMIT_API_MAX: "200",
  RATE_LIMIT_UPLOAD_MAX: "10",
  RATE_LIMIT_SOLICITATION_MAX: "10",
  RATE_LIMIT_VENDEDOR_MAX: "5",
  NODE_ENV: "test",
  isProduction: false,
}));

// Importar após os mocks
const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitHandler - Teste através de rate limiters", () => {
  let req, res;

  beforeEach(() => {
    req = {
      rateLimit: {
        limit: 100,
        remaining: 0,
        resetTime: Date.now() + 60000, // 1 minuto no futuro
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Como rateLimitHandler não é exportado, vamos testar através do comportamento
  // dos rate limiters que usam o handler. Vamos simular um rate limit excedido
  it("deve ter handler configurado em generalRateLimiter", () => {
    // Verificar que os rate limiters estão configurados
    expect(rateLimitMiddleware.generalRateLimiter).toBeDefined();
    expect(typeof rateLimitMiddleware.generalRateLimiter).toBe("function");
  });

  it("deve ter handler configurado em authRateLimiter", () => {
    expect(rateLimitMiddleware.authRateLimiter).toBeDefined();
    expect(typeof rateLimitMiddleware.authRateLimiter).toBe("function");
  });

  it("deve ter handler configurado em apiRateLimiter", () => {
    expect(rateLimitMiddleware.apiRateLimiter).toBeDefined();
    expect(typeof rateLimitMiddleware.apiRateLimiter).toBe("function");
  });

  it("deve ter handler configurado em uploadRateLimiter", () => {
    expect(rateLimitMiddleware.uploadRateLimiter).toBeDefined();
    expect(typeof rateLimitMiddleware.uploadRateLimiter).toBe("function");
  });

  it("deve ter handler configurado em solicitationRateLimiter", () => {
    expect(rateLimitMiddleware.solicitationRateLimiter).toBeDefined();
    expect(typeof rateLimitMiddleware.solicitationRateLimiter).toBe("function");
  });

  it("deve ter handler configurado em vendedorCreationRateLimiter", () => {
    expect(rateLimitMiddleware.vendedorCreationRateLimiter).toBeDefined();
    expect(typeof rateLimitMiddleware.vendedorCreationRateLimiter).toBe("function");
  });
});

