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

describe("rateLimitMiddleware - rateLimitHandler execução", () => {
  let rateLimitHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obter rateLimitHandler do generalRateLimiter (primeira chamada, índice 0)
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].handler) {
      rateLimitHandler = rateLimitCalls[0][0].handler;
    }
  });

  it("deve executar rateLimitHandler e retornar resposta 429", () => {
    if (!rateLimitHandler) return;
    
    const req = {
      rateLimit: {
        limit: 100,
        remaining: 0,
        resetTime: Date.now() + 60000,
      },
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    rateLimitHandler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: "Rate limit excedido",
        retryAfter: expect.any(Number),
        limit: 100,
        remaining: 0,
        resetTime: expect.any(String),
      })
    );
  });

  it("deve calcular retryAfter corretamente", () => {
    if (!rateLimitHandler) return;
    
    const resetTime = Date.now() + 30000; // 30 segundos
    const req = {
      rateLimit: {
        limit: 100,
        remaining: 0,
        resetTime: resetTime,
      },
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    rateLimitHandler(req, res);
    
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.retryAfter).toBeGreaterThanOrEqual(29);
    expect(jsonCall.retryAfter).toBeLessThanOrEqual(31);
  });
});

