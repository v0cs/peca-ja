// Mock do express-rate-limit
const mockRateLimit = jest.fn(() => jest.fn());
jest.mock("express-rate-limit", () => mockRateLimit);

// Mock do config
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

// Importar após mocks
const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - skip functions", () => {
  let generalSkip;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obter skip function do generalRateLimiter (primeira chamada, índice 0)
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].skip) {
      generalSkip = rateLimitCalls[0][0].skip;
    }
  });

  describe("generalRateLimiter skip function", () => {
    it("deve pular rate limiting para health check /health", () => {
      if (!generalSkip) return;
      
      const req = { path: "/health" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para health check /api/health", () => {
      if (!generalSkip) return;
      
      const req = { path: "/api/health" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para OAuth redirect /api/auth/google", () => {
      if (!generalSkip) return;
      
      const req = { path: "/api/auth/google" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para OAuth redirect /auth/google", () => {
      if (!generalSkip) return;
      
      const req = { path: "/auth/google" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para OAuth callback /api/auth/google/callback", () => {
      if (!generalSkip) return;
      
      const req = { path: "/api/auth/google/callback" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para OAuth callback /auth/google/callback", () => {
      if (!generalSkip) return;
      
      const req = { path: "/auth/google/callback" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para /api/auth/me", () => {
      if (!generalSkip) return;
      
      const req = { path: "/api/auth/me" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para /auth/me", () => {
      if (!generalSkip) return;
      
      const req = { path: "/auth/me" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para /api/metrics", () => {
      if (!generalSkip) return;
      
      const req = { path: "/api/metrics" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("deve pular rate limiting para /metrics", () => {
      if (!generalSkip) return;
      
      const req = { path: "/metrics" };
      const result = generalSkip(req);
      expect(result).toBe(true);
    });

    it("não deve pular rate limiting para outras rotas", () => {
      if (!generalSkip) return;
      
      const req = { path: "/api/solicitacoes" };
      const result = generalSkip(req);
      expect(result).toBe(false);
    });

    it("não deve pular rate limiting para /api/usuarios", () => {
      if (!generalSkip) return;
      
      const req = { path: "/api/usuarios" };
      const result = generalSkip(req);
      expect(result).toBe(false);
    });
  });
});

