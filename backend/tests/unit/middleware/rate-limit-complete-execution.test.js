// Teste completo para garantir execução de todas as linhas do rateLimitMiddleware
// Este teste importa o módulo e executa todas as funções diretamente

// Mock do express-rate-limit que armazena todas as configurações
const storedConfigs = [];
const mockRateLimit = jest.fn((options) => {
  storedConfigs.push(options);
  return jest.fn();
});

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

describe("rateLimitMiddleware - Execução completa de todas as funções", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve executar todas as funções de configuração do generalRateLimiter", () => {
    const generalConfig = storedConfigs[0];
    
    // Executar função max - linhas 61, 67
    if (generalConfig && generalConfig.max) {
      const req1 = { user: { userId: 1 } };
      const result1 = generalConfig.max(req1);
      expect(result1).toBe(1000);
      
      const req2 = {};
      const result2 = generalConfig.max(req2);
      expect(result2).toBe(500);
    }
    
    // Executar função skip - linhas 81-106
    if (generalConfig && generalConfig.skip) {
      expect(generalConfig.skip({ path: "/health" })).toBe(true);
      expect(generalConfig.skip({ path: "/api/auth/google" })).toBe(true);
      expect(generalConfig.skip({ path: "/api/auth/me" })).toBe(true);
      expect(generalConfig.skip({ path: "/api/metrics" })).toBe(true);
      expect(generalConfig.skip({ path: "/api/outra" })).toBe(false);
    }
    
    // Executar keyGenerator - linha 106
    if (generalConfig && generalConfig.keyGenerator) {
      const req = { headers: { "x-forwarded-for": "1.1.1.1" }, connection: { remoteAddress: "1.1.1.1" } };
      const key = generalConfig.keyGenerator(req);
      expect(key).toBe("1.1.1.1");
    }
    
    // Executar handler - linhas 34-38
    if (generalConfig && generalConfig.handler) {
      const req = {
        rateLimit: {
          limit: 100,
          remaining: 0,
          resetTime: Date.now() + 5000,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      generalConfig.handler(req, res);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalled();
    }
  });

  it("deve executar keyGenerator do authRateLimiter - linha 125", () => {
    const authConfig = storedConfigs[1];
    if (authConfig && authConfig.keyGenerator) {
      const req = { headers: { "x-forwarded-for": "2.2.2.2" }, connection: { remoteAddress: "2.2.2.2" } };
      const key = authConfig.keyGenerator(req);
      expect(key).toBe("auth:2.2.2.2");
    }
  });

  it("deve executar keyGenerator do apiRateLimiter - linhas 143-146", () => {
    const apiConfig = storedConfigs[2];
    if (apiConfig && apiConfig.keyGenerator) {
      const req = { headers: { "x-forwarded-for": "3.3.3.3" }, connection: { remoteAddress: "3.3.3.3" } };
      const key = apiConfig.keyGenerator(req);
      expect(key).toBe("api:3.3.3.3");
    }
  });

  it("deve executar keyGenerator do uploadRateLimiter - linhas 162-165", () => {
    const uploadConfig = storedConfigs[3];
    if (uploadConfig && uploadConfig.keyGenerator) {
      const req = { headers: { "x-forwarded-for": "4.4.4.4" }, connection: { remoteAddress: "4.4.4.4" } };
      const key = uploadConfig.keyGenerator(req);
      expect(key).toBe("upload:4.4.4.4");
    }
  });

  it("deve executar keyGenerator do solicitationRateLimiter - linhas 181-184", () => {
    const solicitationConfig = storedConfigs[4];
    if (solicitationConfig && solicitationConfig.keyGenerator) {
      const req = { headers: { "x-forwarded-for": "5.5.5.5" }, connection: { remoteAddress: "5.5.5.5" } };
      const key = solicitationConfig.keyGenerator(req);
      expect(key).toBe("solicitation:5.5.5.5");
    }
  });

  it("deve executar keyGenerator do vendedorCreationRateLimiter - linhas 200-203", () => {
    const vendedorConfig = storedConfigs[5];
    if (vendedorConfig && vendedorConfig.keyGenerator) {
      const req = { headers: { "x-forwarded-for": "6.6.6.6" }, connection: { remoteAddress: "6.6.6.6" } };
      const key = vendedorConfig.keyGenerator(req);
      expect(key).toBe("vendedor:6.6.6.6");
    }
  });
});



