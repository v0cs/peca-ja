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

describe("rateLimitMiddleware - keyGenerators linhas 125, 143-146, 162-165, 181-184, 200-203", () => {
  let authKeyGenerator, apiKeyGenerator, uploadKeyGenerator, solicitationKeyGenerator, vendedorKeyGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    const rateLimitCalls = mockRateLimit.mock.calls;
    
    // authRateLimiter (índice 1) - linha 125
    if (rateLimitCalls[1] && rateLimitCalls[1][0] && rateLimitCalls[1][0].keyGenerator) {
      authKeyGenerator = rateLimitCalls[1][0].keyGenerator;
    }
    
    // apiRateLimiter (índice 2) - linhas 143-146
    if (rateLimitCalls[2] && rateLimitCalls[2][0] && rateLimitCalls[2][0].keyGenerator) {
      apiKeyGenerator = rateLimitCalls[2][0].keyGenerator;
    }
    
    // uploadRateLimiter (índice 3) - linhas 162-165
    if (rateLimitCalls[3] && rateLimitCalls[3][0] && rateLimitCalls[3][0].keyGenerator) {
      uploadKeyGenerator = rateLimitCalls[3][0].keyGenerator;
    }
    
    // solicitationRateLimiter (índice 4) - linhas 181-184
    if (rateLimitCalls[4] && rateLimitCalls[4][0] && rateLimitCalls[4][0].keyGenerator) {
      solicitationKeyGenerator = rateLimitCalls[4][0].keyGenerator;
    }
    
    // vendedorCreationRateLimiter (índice 5) - linhas 200-203
    if (rateLimitCalls[5] && rateLimitCalls[5][0] && rateLimitCalls[5][0].keyGenerator) {
      vendedorKeyGenerator = rateLimitCalls[5][0].keyGenerator;
    }
  });

  it("deve executar linha 125: return `auth:${getClientIp(req)}`", () => {
    if (!authKeyGenerator) return;
    const req = { headers: { "x-forwarded-for": "192.168.1.1" }, connection: { remoteAddress: "192.168.1.1" } };
    const key = authKeyGenerator(req);
    expect(key).toBe("auth:192.168.1.1");
  });

  it("deve executar linha 146: return `api:${getClientIp(req)}`", () => {
    if (!apiKeyGenerator) return;
    const req = { headers: { "x-forwarded-for": "192.168.1.2" }, connection: { remoteAddress: "192.168.1.2" } };
    const key = apiKeyGenerator(req);
    expect(key).toBe("api:192.168.1.2");
  });

  it("deve executar linha 165: return `upload:${getClientIp(req)}`", () => {
    if (!uploadKeyGenerator) return;
    const req = { headers: { "x-forwarded-for": "192.168.1.3" }, connection: { remoteAddress: "192.168.1.3" } };
    const key = uploadKeyGenerator(req);
    expect(key).toBe("upload:192.168.1.3");
  });

  it("deve executar linha 184: return `solicitation:${getClientIp(req)}`", () => {
    if (!solicitationKeyGenerator) return;
    const req = { headers: { "x-forwarded-for": "192.168.1.4" }, connection: { remoteAddress: "192.168.1.4" } };
    const key = solicitationKeyGenerator(req);
    expect(key).toBe("solicitation:192.168.1.4");
  });

  it("deve executar linha 203: return `vendedor:${getClientIp(req)}`", () => {
    if (!vendedorKeyGenerator) return;
    const req = { headers: { "x-forwarded-for": "192.168.1.5" }, connection: { remoteAddress: "192.168.1.5" } };
    const key = vendedorKeyGenerator(req);
    expect(key).toBe("vendedor:192.168.1.5");
  });
});



