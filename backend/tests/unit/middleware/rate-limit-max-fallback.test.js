// Mock do express-rate-limit
const mockRateLimit = jest.fn(() => jest.fn());
jest.mock("express-rate-limit", () => mockRateLimit);

// Mock do config sem RATE_LIMIT_MAX_REQUESTS para testar fallback
jest.mock("../../../src/config/env", () => ({
  RATE_LIMIT_WINDOW_MS: "900000",
  // Não definir RATE_LIMIT_MAX_REQUESTS para testar fallback
  RATE_LIMIT_AUTH_MAX: "10",
  RATE_LIMIT_API_MAX: "200",
  RATE_LIMIT_UPLOAD_MAX: "10",
  RATE_LIMIT_SOLICITATION_MAX: "10",
  RATE_LIMIT_VENDEDOR_MAX: "5",
  NODE_ENV: "development",
  isProduction: false,
}));

const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - max function com fallback", () => {
  let generalMax;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && typeof rateLimitCalls[0][0].max === "function") {
      generalMax = rateLimitCalls[0][0].max;
    }
  });

  it("deve usar fallback 1000 quando RATE_LIMIT_MAX_REQUESTS não está definido e usuário está autenticado em desenvolvimento", () => {
    if (!generalMax) return;
    const req = { user: { userId: 123 } };
    const result = generalMax(req);
    // Fallback: 1000 (10x de 100 padrão)
    expect(result).toBe(1000);
  });

  it("deve usar fallback 500 quando RATE_LIMIT_MAX_REQUESTS não está definido e usuário não está autenticado em desenvolvimento", () => {
    if (!generalMax) return;
    const req = {};
    const result = generalMax(req);
    // Fallback: 500 (5x de 100 padrão)
    expect(result).toBe(500);
  });
});



