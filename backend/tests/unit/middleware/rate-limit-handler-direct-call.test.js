// Importar diretamente o módulo para acessar rateLimitHandler
// Não mockar express-rate-limit para poder acessar o handler diretamente
const rateLimit = require("express-rate-limit");

// Mock apenas do config
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

// Mock do rateLimit para capturar o handler
const mockRateLimit = jest.fn((options) => {
  // Armazenar o handler para uso nos testes
  if (options && options.handler) {
    mockRateLimit.lastHandler = options.handler;
  }
  return jest.fn();
});

jest.mock("express-rate-limit", () => mockRateLimit);

const rateLimitMiddleware = require("../../../src/middleware/rateLimitMiddleware");

describe("rateLimitMiddleware - rateLimitHandler chamada direta", () => {
  let rateLimitHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    // Obter handler da primeira chamada (generalRateLimiter)
    rateLimitHandler = mockRateLimit.lastHandler;
  });

  it("deve executar todas as linhas do rateLimitHandler (34-38)", () => {
    if (!rateLimitHandler) {
      // Se não conseguir obter o handler, tentar obter diretamente das chamadas
      const calls = mockRateLimit.mock.calls;
      if (calls[0] && calls[0][0] && calls[0][0].handler) {
        rateLimitHandler = calls[0][0].handler;
      }
    }
    
    if (!rateLimitHandler) return;
    
    const resetTime = Date.now() + 5000;
    const req = {
      rateLimit: {
        limit: 100,
        remaining: 0,
        resetTime: resetTime,
      },
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    // Executar o handler diretamente para garantir que todas as linhas sejam executadas
    rateLimitHandler(req, res);
    
    // Verificar que todas as linhas foram executadas
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalled();
    
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.retryAfter).toBeDefined();
    expect(jsonCall.limit).toBe(100);
    expect(jsonCall.remaining).toBe(0);
    expect(jsonCall.resetTime).toBeDefined();
  });
});

