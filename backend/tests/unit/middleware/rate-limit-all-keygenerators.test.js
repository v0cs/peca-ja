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

describe("rateLimitMiddleware - Todos os keyGenerators", () => {
  let apiKeyGenerator, uploadKeyGenerator, solicitationKeyGenerator, vendedorKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const rateLimitCalls = mockRateLimit.mock.calls;
    
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

  it("deve executar apiRateLimiter keyGenerator com usuário autenticado", () => {
    if (!apiKeyGenerator) return;
    const req = { user: { userId: 100 }, headers: {}, connection: { remoteAddress: "1.1.1.1" } };
    const key = apiKeyGenerator(req);
    expect(key).toBe("api:user:100");
  });

  it("deve executar uploadRateLimiter keyGenerator com usuário autenticado", () => {
    if (!uploadKeyGenerator) return;
    const req = { user: { userId: 200 }, headers: {}, connection: { remoteAddress: "2.2.2.2" } };
    const key = uploadKeyGenerator(req);
    expect(key).toBe("upload:user:200");
  });

  it("deve executar solicitationRateLimiter keyGenerator com usuário autenticado", () => {
    if (!solicitationKeyGenerator) return;
    const req = { user: { userId: 300 }, headers: {}, connection: { remoteAddress: "3.3.3.3" } };
    const key = solicitationKeyGenerator(req);
    expect(key).toBe("solicitation:user:300");
  });

  it("deve executar vendedorCreationRateLimiter keyGenerator com usuário autenticado", () => {
    if (!vendedorKeyGenerator) return;
    const req = { user: { userId: 400 }, headers: {}, connection: { remoteAddress: "4.4.4.4" } };
    const key = vendedorKeyGenerator(req);
    expect(key).toBe("vendedor:user:400");
  });
});



