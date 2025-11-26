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

describe("rateLimitMiddleware - vendedorCreationRateLimiter keyGenerator com IP", () => {
  let vendedorKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[5] && rateLimitCalls[5][0] && rateLimitCalls[5][0].keyGenerator) {
      vendedorKeyGenerator = rateLimitCalls[5][0].keyGenerator;
    }
  });

  it("deve executar keyGenerator do vendedorCreationRateLimiter sem usuário autenticado (linha 203)", () => {
    if (!vendedorKeyGenerator) return;
    const req = {
      headers: { "x-forwarded-for": "192.168.1.40" },
      connection: { remoteAddress: "192.168.1.40" },
    };
    const key = vendedorKeyGenerator(req);
    expect(key).toBe("vendedor:192.168.1.40");
  });
});

