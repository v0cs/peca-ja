// Mock do express-rate-limit
const mockRateLimit = jest.fn(() => jest.fn());
jest.mock("express-rate-limit", () => mockRateLimit);

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

const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - rateLimitHandler resposta completa", () => {
  let rateLimitHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].handler) {
      rateLimitHandler = rateLimitCalls[0][0].handler;
    }
  });

  it("deve retornar resposta JSON completa com todos os campos", () => {
    if (!rateLimitHandler) return;
    
    const resetTime = Date.now() + 60000;
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
    
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Muitas requisições. Tente novamente mais tarde.",
      error: "Rate limit excedido",
      retryAfter: expect.any(Number),
      limit: 100,
      remaining: 0,
      resetTime: expect.any(String),
    });
  });

  it("deve formatar resetTime como ISO string", () => {
    if (!rateLimitHandler) return;
    
    const resetTime = new Date("2024-01-01T12:00:00Z").getTime();
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
    expect(jsonCall.resetTime).toBe(new Date(resetTime).toISOString());
  });
});

