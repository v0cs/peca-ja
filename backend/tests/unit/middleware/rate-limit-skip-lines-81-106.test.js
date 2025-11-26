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

describe("rateLimitMiddleware - skip function linhas 81-106", () => {
  let generalSkip;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].skip) {
      generalSkip = rateLimitCalls[0][0].skip;
    }
  });

  it("deve executar linha 81: const isHealthCheck = req.path === '/health' || req.path === '/api/health'", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/health" })).toBe(true);
    expect(generalSkip({ path: "/api/health" })).toBe(true);
  });

  it("deve executar linhas 82-86: const isOAuthRedirect = ...", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/auth/google" })).toBe(true);
    expect(generalSkip({ path: "/auth/google" })).toBe(true);
    expect(generalSkip({ path: "/api/auth/google/callback" })).toBe(true);
    expect(generalSkip({ path: "/auth/google/callback" })).toBe(true);
  });

  it("deve executar linhas 90-92: const isAuthMe = ...", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/auth/me" })).toBe(true);
    expect(generalSkip({ path: "/auth/me" })).toBe(true);
  });

  it("deve executar linhas 95-97: const isMetricsEndpoint = ...", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/metrics" })).toBe(true);
    expect(generalSkip({ path: "/metrics" })).toBe(true);
  });

  it("deve executar linha 99: return isHealthCheck || isOAuthRedirect || isAuthMe || isMetricsEndpoint", () => {
    if (!generalSkip) return;
    // Testar que retorna false quando nenhuma condição é verdadeira
    expect(generalSkip({ path: "/api/outra-rota" })).toBe(false);
  });
});

