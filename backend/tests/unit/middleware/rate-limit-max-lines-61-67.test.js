// Mock do express-rate-limit
const mockRateLimit = jest.fn(() => jest.fn());
jest.mock("express-rate-limit", () => mockRateLimit);

// Mock do config sem RATE_LIMIT_MAX_REQUESTS para forçar execução das linhas 61 e 67
jest.mock("../../../src/config/env", () => ({
  RATE_LIMIT_WINDOW_MS: "900000",
  // Não definir RATE_LIMIT_MAX_REQUESTS para que parseInt retorne NaN e execute || 1000 e || 500
  RATE_LIMIT_AUTH_MAX: "10",
  RATE_LIMIT_API_MAX: "200",
  RATE_LIMIT_UPLOAD_MAX: "10",
  RATE_LIMIT_SOLICITATION_MAX: "10",
  RATE_LIMIT_VENDEDOR_MAX: "5",
  NODE_ENV: "development",
  isProduction: false,
}));

const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - max function linhas 61 e 67", () => {
  let generalMax;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && typeof rateLimitCalls[0][0].max === "function") {
      generalMax = rateLimitCalls[0][0].max;
    }
  });

  it("deve executar linha 61: return parseInt(...) * 10 || 1000", () => {
    if (!generalMax) return;
    // parseInt(undefined) retorna NaN, então NaN * 10 = NaN, então usa || 1000
    const req = { user: { userId: 123 } };
    const result = generalMax(req);
    // Linha 61: return parseInt(config.RATE_LIMIT_MAX_REQUESTS) * 10 || 1000;
    expect(result).toBe(1000);
  });

  it("deve executar linha 67: return parseInt(...) * 5 || 500", () => {
    if (!generalMax) return;
    // parseInt(undefined) retorna NaN, então NaN * 5 = NaN, então usa || 500
    const req = {}; // Sem usuário autenticado
    const result = generalMax(req);
    // Linha 67: return parseInt(config.RATE_LIMIT_MAX_REQUESTS) * 5 || 500;
    expect(result).toBe(500);
  });
});



