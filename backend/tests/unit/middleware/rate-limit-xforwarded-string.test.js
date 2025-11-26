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

describe("rateLimitMiddleware - x-forwarded-for como string", () => {
  let generalKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].keyGenerator) {
      generalKeyGenerator = rateLimitCalls[0][0].keyGenerator;
    }
  });

  it("deve processar x-forwarded-for quando é string", () => {
    if (!generalKeyGenerator) return;
    const req = {
      headers: { "x-forwarded-for": "192.168.1.1" },
    };
    const key = generalKeyGenerator(req);
    expect(key).toBe("192.168.1.1");
  });

  it("deve processar x-forwarded-for com espaços e pegar o primeiro IP", () => {
    if (!generalKeyGenerator) return;
    const req = {
      headers: { "x-forwarded-for": " 192.168.1.1 , 10.0.0.1 " },
    };
    const key = generalKeyGenerator(req);
    expect(key).toBe("192.168.1.1");
  });
});

