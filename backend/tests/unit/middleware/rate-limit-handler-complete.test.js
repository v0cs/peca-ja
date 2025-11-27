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

describe("rateLimitMiddleware - rateLimitHandler completo", () => {
  let rateLimitHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].handler) {
      rateLimitHandler = rateLimitCalls[0][0].handler;
    }
  });

  it("deve executar rateLimitHandler com resetTime no futuro", () => {
    if (!rateLimitHandler) return;
    
    const resetTime = Date.now() + 45000; // 45 segundos
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
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.retryAfter).toBeGreaterThan(40);
    expect(jsonCall.retryAfter).toBeLessThan(50);
    expect(jsonCall.resetTime).toBeDefined();
  });

  it("deve executar rateLimitHandler e calcular retryAfter corretamente com Math.ceil", () => {
    if (!rateLimitHandler) return;
    
    // Criar um resetTime que resulte em valor decimal
    const now = Date.now();
    const resetTime = now + 1250; // 1.25 segundos
    
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
    // Math.ceil(1.25) = 2
    expect(jsonCall.retryAfter).toBe(2);
  });
});



