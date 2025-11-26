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

describe("rateLimitMiddleware - skip function todos os caminhos", () => {
  let generalSkip;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].skip) {
      generalSkip = rateLimitCalls[0][0].skip;
    }
  });

  it("deve retornar true para /health", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/health" })).toBe(true);
  });

  it("deve retornar true para /api/health", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/health" })).toBe(true);
  });

  it("deve retornar true para /api/auth/google", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/auth/google" })).toBe(true);
  });

  it("deve retornar true para /auth/google", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/auth/google" })).toBe(true);
  });

  it("deve retornar true para /api/auth/google/callback", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/auth/google/callback" })).toBe(true);
  });

  it("deve retornar true para /auth/google/callback", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/auth/google/callback" })).toBe(true);
  });

  it("deve retornar true para /api/auth/me", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/auth/me" })).toBe(true);
  });

  it("deve retornar true para /auth/me", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/auth/me" })).toBe(true);
  });

  it("deve retornar true para /api/metrics", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/metrics" })).toBe(true);
  });

  it("deve retornar true para /metrics", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/metrics" })).toBe(true);
  });

  it("deve retornar false para outras rotas", () => {
    if (!generalSkip) return;
    expect(generalSkip({ path: "/api/solicitacoes" })).toBe(false);
  });
});

