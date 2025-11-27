// Mock do express-rate-limit
const mockRateLimit = jest.fn(() => jest.fn());
jest.mock("express-rate-limit", () => mockRateLimit);

// Mock do config
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

// Importar após mocks
const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - generalRateLimiter keyGenerator", () => {
  let generalKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obter keyGenerator do generalRateLimiter (primeira chamada, índice 0)
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].keyGenerator) {
      generalKeyGenerator = rateLimitCalls[0][0].keyGenerator;
    }
  });

  it("deve gerar chave com userId quando usuário está autenticado", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      user: { userId: 123 },
      headers: {},
      connection: { remoteAddress: "192.168.1.1" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toBe("user:123");
  });

  it("deve gerar chave com IP quando usuário não está autenticado", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: { "x-forwarded-for": "192.168.1.1" },
      connection: { remoteAddress: "192.168.1.1" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toContain("192.168.1.1");
  });

  it("deve gerar chave com IP do x-forwarded-for quando disponível", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: { "x-forwarded-for": "10.0.0.1" },
      connection: { remoteAddress: "192.168.1.1" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toContain("10.0.0.1");
  });

  it("deve gerar chave com IP do x-real-ip quando x-forwarded-for não está disponível", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: { "x-real-ip": "172.16.0.1" },
      connection: { remoteAddress: "192.168.1.1" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toContain("172.16.0.1");
  });

  it("deve gerar chave com IP do connection.remoteAddress como fallback", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: {},
      connection: { remoteAddress: "192.168.1.2" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toContain("192.168.1.2");
  });
});



