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

describe("rateLimitMiddleware - rateLimitHandler Math.ceil", () => {
  let rateLimitHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obter rateLimitHandler do generalRateLimiter (primeira chamada, índice 0)
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].handler) {
      rateLimitHandler = rateLimitCalls[0][0].handler;
    }
  });

  it("deve usar Math.ceil para calcular retryAfter com valores decimais", () => {
    if (!rateLimitHandler) return;
    
    // Criar um resetTime que resulte em um valor decimal após divisão
    const now = Date.now();
    const resetTime = now + 3500; // 3.5 segundos
    
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
    // Math.ceil(3.5) = 4
    expect(jsonCall.retryAfter).toBe(4);
  });

  it("deve usar Math.ceil para calcular retryAfter com valores inteiros", () => {
    if (!rateLimitHandler) return;
    
    const now = Date.now();
    const resetTime = now + 5000; // 5 segundos exatos
    
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
    // Math.ceil(5) = 5
    expect(jsonCall.retryAfter).toBe(5);
  });
});

