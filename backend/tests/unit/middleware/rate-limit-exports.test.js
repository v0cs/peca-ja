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

describe("rateLimitMiddleware - Exports", () => {
  it("deve exportar todos os rate limiters", () => {
    expect(rateLimitMiddleware.generalRateLimiter).toBeDefined();
    expect(rateLimitMiddleware.authRateLimiter).toBeDefined();
    expect(rateLimitMiddleware.apiRateLimiter).toBeDefined();
    expect(rateLimitMiddleware.uploadRateLimiter).toBeDefined();
    expect(rateLimitMiddleware.solicitationRateLimiter).toBeDefined();
    expect(rateLimitMiddleware.vendedorCreationRateLimiter).toBeDefined();
    expect(rateLimitMiddleware.getClientIp).toBeDefined();
  });

  it("deve exportar getClientIp como função", () => {
    expect(typeof rateLimitMiddleware.getClientIp).toBe("function");
  });

  it("deve executar getClientIp exportado", () => {
    const req = {
      headers: { "x-forwarded-for": "192.168.1.100" },
      connection: { remoteAddress: "192.168.1.100" },
    };
    
    const ip = rateLimitMiddleware.getClientIp(req);
    expect(ip).toBe("192.168.1.100");
  });
});

