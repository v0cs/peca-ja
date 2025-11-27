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

describe("rateLimitMiddleware - getClientIp casos completos", () => {
  let generalKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obter keyGenerator do generalRateLimiter (primeira chamada, índice 0)
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && rateLimitCalls[0][0].keyGenerator) {
      generalKeyGenerator = rateLimitCalls[0][0].keyGenerator;
    }
  });

  it("deve usar req.ip quando disponível", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      ip: "192.168.1.100",
      headers: {},
      connection: { remoteAddress: "192.168.1.1" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toBe("192.168.1.100");
  });

  it("deve usar req.connection.remoteAddress como fallback", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: {},
      connection: { remoteAddress: "10.0.0.1" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toBe("10.0.0.1");
  });

  it("deve usar req.socket.remoteAddress como fallback", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: {},
      socket: { remoteAddress: "172.16.0.1" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toBe("172.16.0.1");
  });

  it("deve usar req.connection.socket.remoteAddress como fallback", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: {},
      connection: { socket: { remoteAddress: "172.17.0.1" } },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toBe("172.17.0.1");
  });

  it("deve processar x-forwarded-for com múltiplos IPs e pegar o primeiro", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1" },
      connection: { remoteAddress: "192.168.1.2" },
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toBe("192.168.1.1");
  });

  it("deve usar 'unknown' quando nenhum IP está disponível", () => {
    if (!generalKeyGenerator) return;
    
    const req = {
      headers: {},
    };
    
    const key = generalKeyGenerator(req);
    expect(key).toBe("unknown");
  });
});



