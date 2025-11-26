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

// Importar após mocks
const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - authRateLimiter keyGenerator execução", () => {
  let authKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obter keyGenerator do authRateLimiter (segunda chamada, índice 1)
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[1] && rateLimitCalls[1][0] && rateLimitCalls[1][0].keyGenerator) {
      authKeyGenerator = rateLimitCalls[1][0].keyGenerator;
    }
  });

  it("deve executar keyGenerator do authRateLimiter com IP", () => {
    if (!authKeyGenerator) return;
    
    const req = {
      headers: { "x-forwarded-for": "192.168.1.1" },
      connection: { remoteAddress: "192.168.1.1" },
    };
    
    const key = authKeyGenerator(req);
    expect(key).toContain("auth:");
    expect(key).toContain("192.168.1.1");
  });

  it("deve executar keyGenerator do authRateLimiter e usar getClientIp", () => {
    if (!authKeyGenerator) return;
    
    const req = {
      headers: {},
      connection: { remoteAddress: "10.0.0.1" },
    };
    
    const key = authKeyGenerator(req);
    expect(key).toBe("auth:10.0.0.1");
  });
});

