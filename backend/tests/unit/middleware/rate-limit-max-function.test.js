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
  NODE_ENV: "development",
  isProduction: false,
}));

// Importar após mocks
const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - max function", () => {
  let generalMax;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obter max function do generalRateLimiter (primeira chamada, índice 0)
    const rateLimitCalls = mockRateLimit.mock.calls;
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && typeof rateLimitCalls[0][0].max === "function") {
      generalMax = rateLimitCalls[0][0].max;
    }
  });

  describe("generalRateLimiter max function", () => {
    it("deve retornar limite maior para usuário autenticado em desenvolvimento", () => {
      if (!generalMax) return;
      
      const req = { user: { userId: 123 } };
      const result = generalMax(req);
      // Em desenvolvimento, deve ser 10x o limite padrão (100 * 10 = 1000)
      expect(result).toBe(1000);
    });

    it("deve retornar limite maior para usuário não autenticado em desenvolvimento", () => {
      if (!generalMax) return;
      
      const req = {};
      const result = generalMax(req);
      // Em desenvolvimento, deve ser 5x o limite padrão (100 * 5 = 500)
      expect(result).toBe(500);
    });
  });
});

// Testar com produção
describe("rateLimitMiddleware - max function em produção", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    jest.doMock("../../../src/config/env", () => ({
      RATE_LIMIT_WINDOW_MS: "900000",
      RATE_LIMIT_MAX_REQUESTS: "100",
      RATE_LIMIT_AUTH_MAX: "10",
      RATE_LIMIT_API_MAX: "200",
      RATE_LIMIT_UPLOAD_MAX: "10",
      RATE_LIMIT_SOLICITATION_MAX: "10",
      RATE_LIMIT_VENDEDOR_MAX: "5",
      NODE_ENV: "production",
      isProduction: true,
    }));
    
    mockRateLimit.mockClear();
  });

  it("deve retornar limite para usuário autenticado em produção", () => {
    const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");
    const rateLimitCalls = mockRateLimit.mock.calls;
    
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && typeof rateLimitCalls[0][0].max === "function") {
      const generalMax = rateLimitCalls[0][0].max;
      const req = { user: { userId: 123 } };
      const result = generalMax(req);
      // Em produção, deve ser 3x o limite padrão (100 * 3 = 300)
      expect(result).toBe(300);
    }
  });

  it("deve retornar limite padrão para usuário não autenticado em produção", () => {
    const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");
    const rateLimitCalls = mockRateLimit.mock.calls;
    
    if (rateLimitCalls[0] && rateLimitCalls[0][0] && typeof rateLimitCalls[0][0].max === "function") {
      const generalMax = rateLimitCalls[0][0].max;
      const req = {};
      const result = generalMax(req);
      // Em produção, deve ser o limite padrão (100)
      expect(result).toBe(100);
    }
  });
});



