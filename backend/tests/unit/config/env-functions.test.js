// Testar apenas as exportações do env.js sem tentar modificar o comportamento
// já que o módulo executa código no carregamento

describe("env.js - Exportações", () => {
  const env = require("../../../src/config/env");

  it("deve exportar isProduction", () => {
    expect(env.isProduction).toBeDefined();
    expect(typeof env.isProduction).toBe("boolean");
  });

  it("deve exportar NODE_ENV", () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(typeof env.NODE_ENV).toBe("string");
  });

  it("deve exportar PORT", () => {
    expect(env.PORT).toBeDefined();
    // PORT pode ser string ou number dependendo da configuração
    expect(typeof env.PORT === "string" || typeof env.PORT === "number").toBe(true);
  });

  it("deve exportar baseURL", () => {
    expect(env.baseURL).toBeDefined();
    expect(typeof env.baseURL).toBe("string");
  });

  it("deve exportar frontendURL", () => {
    expect(env.frontendURL).toBeDefined();
    expect(typeof env.frontendURL).toBe("string");
  });

  it("deve exportar apiURL", () => {
    expect(env.apiURL).toBeDefined();
    expect(typeof env.apiURL).toBe("string");
  });

  it("deve exportar domain", () => {
    expect(env.domain).toBeDefined();
    expect(typeof env.domain).toBe("string");
  });

  it("deve exportar emailFrom", () => {
    expect(env.emailFrom).toBeDefined();
    expect(typeof env.emailFrom).toBe("string");
    expect(env.emailFrom).toContain("PeçaJá");
  });

  it("deve exportar JWT_SECRET", () => {
    expect(env.JWT_SECRET).toBeDefined();
  });

  it("deve exportar DB_HOST", () => {
    expect(env.DB_HOST).toBeDefined();
  });

  it("deve exportar DB_PORT", () => {
    expect(env.DB_PORT).toBeDefined();
  });

  it("deve exportar DB_NAME", () => {
    expect(env.DB_NAME).toBeDefined();
  });

  it("deve exportar DB_USER", () => {
    // DB_USER é exportado (pode ter valor padrão)
    expect(env.DB_USER).toBeDefined();
  });

  it("deve exportar DB_PASSWORD", () => {
    expect(env.DB_PASSWORD).toBeDefined();
  });

  it("deve exportar RESEND_API_KEY", () => {
    // RESEND_API_KEY pode ser undefined se não configurado
    expect(env).toHaveProperty("RESEND_API_KEY");
  });

  it("deve exportar variáveis AWS quando configuradas", () => {
    // Essas podem ser undefined, mas devem estar no objeto
    expect(env).toHaveProperty("AWS_ACCESS_KEY_ID");
    expect(env).toHaveProperty("AWS_SECRET_ACCESS_KEY");
    expect(env).toHaveProperty("AWS_REGION");
    expect(env).toHaveProperty("AWS_S3_BUCKET_NAME");
  });

  it("deve exportar variáveis de rate limit", () => {
    expect(env.RATE_LIMIT_WINDOW_MS).toBeDefined();
    expect(env.RATE_LIMIT_MAX_REQUESTS).toBeDefined();
    expect(env.RATE_LIMIT_AUTH_MAX).toBeDefined();
    expect(env.RATE_LIMIT_API_MAX).toBeDefined();
    expect(env.RATE_LIMIT_UPLOAD_MAX).toBeDefined();
    expect(env.RATE_LIMIT_SOLICITATION_MAX).toBeDefined();
    expect(env.RATE_LIMIT_VENDEDOR_MAX).toBeDefined();
  });
});

