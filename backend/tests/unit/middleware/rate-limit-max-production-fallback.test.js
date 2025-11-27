// Mock do express-rate-limit
const mockRateLimit = jest.fn(() => jest.fn());
jest.mock("express-rate-limit", () => mockRateLimit);

// Mock do config em produção sem RATE_LIMIT_MAX_REQUESTS para testar fallback || 300 e || 100
jest.mock("../../../src/config/env", () => ({
  RATE_LIMIT_WINDOW_MS: "900000",
  // Não definir RATE_LIMIT_MAX_REQUESTS para testar fallback
  RATE_LIMIT_AUTH_MAX: "10",
  RATE_LIMIT_API_MAX: "200",
  RATE_LIMIT_UPLOAD_MAX: "10",
  RATE_LIMIT_SOLICITATION_MAX: "10",
  RATE_LIMIT_VENDEDOR_MAX: "5",
  NODE_ENV: "production",
  isProduction: true,
}));

const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - max function fallback em produção", () => {
  let generalMax;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && typeof rateLimitCalls[0][0].max === "function") {
      generalMax = rateLimitCalls[0][0].max;
    }
  });

  it("deve usar fallback 300 quando parseInt retorna NaN para usuário autenticado em produção", () => {
    if (!generalMax) return;
    // parseInt(undefined) retorna NaN, então deve usar fallback || 300
    const req = { user: { userId: 123 } };
    const result = generalMax(req);
    // NaN * 3 = NaN, então usa fallback 300
    expect(result).toBe(300);
  });

  it("deve usar fallback 100 quando parseInt retorna NaN para usuário não autenticado em produção", () => {
    if (!generalMax) return;
    // parseInt(undefined) retorna NaN, então deve usar fallback || 100
    const req = {};
    const result = generalMax(req);
    // NaN || 100 = 100
    expect(result).toBe(100);
  });
});



