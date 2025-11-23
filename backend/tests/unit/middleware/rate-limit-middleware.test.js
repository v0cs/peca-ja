// Mock do express-rate-limit ANTES de qualquer require
jest.mock("express-rate-limit", () => {
  return jest.fn((options) => {
    return (req, res, next) => {
      req.rateLimit = {
        limit: options.max || 100,
        remaining: 99,
        resetTime: Date.now() + 60000,
      };
      next();
    };
  });
});

// Mock do config ANTES de qualquer require
jest.mock("../../../src/config/env", () => ({
  RATE_LIMIT_GENERAL_MAX: 100,
  RATE_LIMIT_GENERAL_WINDOW: 15,
  RATE_LIMIT_AUTH_MAX: 5,
  RATE_LIMIT_AUTH_WINDOW: 15,
  RATE_LIMIT_API_MAX: 1000,
  RATE_LIMIT_API_WINDOW: 60,
  RATE_LIMIT_UPLOAD_MAX: 10,
  RATE_LIMIT_UPLOAD_WINDOW: 60,
  RATE_LIMIT_SOLICITATION_MAX: 20,
  RATE_LIMIT_SOLICITATION_WINDOW: 60,
  RATE_LIMIT_VENDEDOR_CREATION_MAX: 3,
  RATE_LIMIT_VENDEDOR_CREATION_WINDOW: 60,
}));

const {
  generalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  solicitationRateLimiter,
  vendedorCreationRateLimiter,
} = require("../../../src/middleware/rateLimitMiddleware");

describe("Rate Limit Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      ip: "127.0.0.1",
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  describe("generalRateLimiter", () => {
    it("deve criar um rate limiter geral", () => {
      const limiter = generalRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = generalRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("authRateLimiter", () => {
    it("deve criar um rate limiter para autenticação", () => {
      const limiter = authRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = authRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("apiRateLimiter", () => {
    it("deve criar um rate limiter para API", () => {
      const limiter = apiRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = apiRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("uploadRateLimiter", () => {
    it("deve criar um rate limiter para upload", () => {
      const limiter = uploadRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = uploadRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("solicitationRateLimiter", () => {
    it("deve criar um rate limiter para solicitações", () => {
      const limiter = solicitationRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = solicitationRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("vendedorCreationRateLimiter", () => {
    it("deve criar um rate limiter para criação de vendedores", () => {
      const limiter = vendedorCreationRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = vendedorCreationRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

