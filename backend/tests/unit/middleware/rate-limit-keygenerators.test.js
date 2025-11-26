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

describe("rateLimitMiddleware - keyGenerators", () => {
  let authKeyGenerator, apiKeyGenerator, uploadKeyGenerator, solicitationKeyGenerator, vendedorKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Obter keyGenerators das chamadas do rateLimit
    const rateLimitCalls = mockRateLimit.mock.calls;
    
    // authRateLimiter (segunda chamada, índice 1)
    if (rateLimitCalls[1] && rateLimitCalls[1][0] && rateLimitCalls[1][0].keyGenerator) {
      authKeyGenerator = rateLimitCalls[1][0].keyGenerator;
    }
    
    // apiRateLimiter (terceira chamada, índice 2)
    if (rateLimitCalls[2] && rateLimitCalls[2][0] && rateLimitCalls[2][0].keyGenerator) {
      apiKeyGenerator = rateLimitCalls[2][0].keyGenerator;
    }
    
    // uploadRateLimiter (quarta chamada, índice 3)
    if (rateLimitCalls[3] && rateLimitCalls[3][0] && rateLimitCalls[3][0].keyGenerator) {
      uploadKeyGenerator = rateLimitCalls[3][0].keyGenerator;
    }
    
    // solicitationRateLimiter (quinta chamada, índice 4)
    if (rateLimitCalls[4] && rateLimitCalls[4][0] && rateLimitCalls[4][0].keyGenerator) {
      solicitationKeyGenerator = rateLimitCalls[4][0].keyGenerator;
    }
    
    // vendedorCreationRateLimiter (sexta chamada, índice 5)
    if (rateLimitCalls[5] && rateLimitCalls[5][0] && rateLimitCalls[5][0].keyGenerator) {
      vendedorKeyGenerator = rateLimitCalls[5][0].keyGenerator;
    }
  });

  describe("authRateLimiter keyGenerator", () => {
    it("deve gerar chave com IP quando usuário não está autenticado", () => {
      if (!authKeyGenerator) return;
      
      const req = {
        headers: { "x-forwarded-for": "192.168.1.1" },
        connection: { remoteAddress: "192.168.1.1" },
      };
      
      const key = authKeyGenerator(req);
      expect(key).toContain("auth:");
      expect(key).toContain("192.168.1.1");
    });

    it("deve gerar chave com IP mesmo quando usuário está autenticado", () => {
      if (!authKeyGenerator) return;
      
      const req = {
        user: { userId: 123 },
        headers: { "x-forwarded-for": "192.168.1.1" },
        connection: { remoteAddress: "192.168.1.1" },
      };
      
      const key = authKeyGenerator(req);
      // authRateLimiter sempre usa IP, não userId
      expect(key).toContain("auth:");
      expect(key).not.toContain("user:123");
    });
  });

  describe("apiRateLimiter keyGenerator", () => {
    it("deve gerar chave com userId quando usuário está autenticado", () => {
      if (!apiKeyGenerator) return;
      
      const req = {
        user: { userId: 456 },
        headers: {},
        connection: { remoteAddress: "192.168.1.1" },
      };
      
      const key = apiKeyGenerator(req);
      expect(key).toBe("api:user:456");
    });

    it("deve gerar chave com IP quando usuário não está autenticado", () => {
      if (!apiKeyGenerator) return;
      
      const req = {
        headers: { "x-forwarded-for": "192.168.1.2" },
        connection: { remoteAddress: "192.168.1.2" },
      };
      
      const key = apiKeyGenerator(req);
      expect(key).toContain("api:");
      expect(key).toContain("192.168.1.2");
    });
  });

  describe("uploadRateLimiter keyGenerator", () => {
    it("deve gerar chave com userId quando usuário está autenticado", () => {
      if (!uploadKeyGenerator) return;
      
      const req = {
        user: { userId: 789 },
        headers: {},
        connection: { remoteAddress: "192.168.1.1" },
      };
      
      const key = uploadKeyGenerator(req);
      expect(key).toBe("upload:user:789");
    });

    it("deve gerar chave com IP quando usuário não está autenticado", () => {
      if (!uploadKeyGenerator) return;
      
      const req = {
        headers: { "x-forwarded-for": "192.168.1.3" },
        connection: { remoteAddress: "192.168.1.3" },
      };
      
      const key = uploadKeyGenerator(req);
      expect(key).toContain("upload:");
      expect(key).toContain("192.168.1.3");
    });
  });

  describe("solicitationRateLimiter keyGenerator", () => {
    it("deve gerar chave com userId quando usuário está autenticado", () => {
      if (!solicitationKeyGenerator) return;
      
      const req = {
        user: { userId: 101 },
        headers: {},
        connection: { remoteAddress: "192.168.1.1" },
      };
      
      const key = solicitationKeyGenerator(req);
      expect(key).toBe("solicitation:user:101");
    });

    it("deve gerar chave com IP quando usuário não está autenticado", () => {
      if (!solicitationKeyGenerator) return;
      
      const req = {
        headers: { "x-forwarded-for": "192.168.1.4" },
        connection: { remoteAddress: "192.168.1.4" },
      };
      
      const key = solicitationKeyGenerator(req);
      expect(key).toContain("solicitation:");
      expect(key).toContain("192.168.1.4");
    });
  });

  describe("vendedorCreationRateLimiter keyGenerator", () => {
    it("deve gerar chave com userId quando usuário está autenticado", () => {
      if (!vendedorKeyGenerator) return;
      
      const req = {
        user: { userId: 202 },
        headers: {},
        connection: { remoteAddress: "192.168.1.1" },
      };
      
      const key = vendedorKeyGenerator(req);
      expect(key).toBe("vendedor:user:202");
    });

    it("deve gerar chave com IP quando usuário não está autenticado", () => {
      if (!vendedorKeyGenerator) return;
      
      const req = {
        headers: { "x-forwarded-for": "192.168.1.5" },
        connection: { remoteAddress: "192.168.1.5" },
      };
      
      const key = vendedorKeyGenerator(req);
      expect(key).toContain("vendedor:");
      expect(key).toContain("192.168.1.5");
    });
  });
});

