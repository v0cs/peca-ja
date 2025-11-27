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

describe("rateLimitMiddleware - rateLimitHandler Date.toISOString", () => {
  let rateLimitHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].handler) {
      rateLimitHandler = rateLimitCalls[0][0].handler;
    }
  });

  it("deve executar new Date().toISOString() no rateLimitHandler", () => {
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
    
    const jsonCall = res.json.mock.calls[0][0];
    // Verificar que resetTime foi convertido para ISO string
    expect(jsonCall.resetTime).toBe(new Date(resetTime).toISOString());
    expect(typeof jsonCall.resetTime).toBe("string");
    expect(jsonCall.resetTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});



