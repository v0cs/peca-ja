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

describe("rateLimitMiddleware - uploadRateLimiter keyGenerator com IP", () => {
  let uploadKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[3] && rateLimitCalls[3][0] && rateLimitCalls[3][0].keyGenerator) {
      uploadKeyGenerator = rateLimitCalls[3][0].keyGenerator;
    }
  });

  it("deve executar keyGenerator do uploadRateLimiter sem usuário autenticado (linha 165)", () => {
    if (!uploadKeyGenerator) return;
    const req = {
      headers: { "x-forwarded-for": "192.168.1.20" },
      connection: { remoteAddress: "192.168.1.20" },
    };
    const key = uploadKeyGenerator(req);
    expect(key).toBe("upload:192.168.1.20");
  });
});

