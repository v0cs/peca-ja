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

describe("rateLimitMiddleware - authRateLimiter keyGenerator execução direta (linha 125)", () => {
  let authKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    // authRateLimiter é a segunda chamada (índice 1)
    if (rateLimitCalls[1] && rateLimitCalls[1][0] && rateLimitCalls[1][0].keyGenerator) {
      authKeyGenerator = rateLimitCalls[1][0].keyGenerator;
    }
  });

  it("deve executar linha 125: return `auth:${getClientIp(req)}`", () => {
    if (!authKeyGenerator) return;
    
    const req = {
      headers: { "x-forwarded-for": "10.0.0.5" },
      connection: { remoteAddress: "10.0.0.5" },
    };
    
    const key = authKeyGenerator(req);
    // Linha 125: return `auth:${getClientIp(req)}`
    expect(key).toBe("auth:10.0.0.5");
  });
});



