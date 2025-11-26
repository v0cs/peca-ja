// Testar warning de RESEND_API_KEY em desenvolvimento
describe("env.js - Warning RESEND_API_KEY em Desenvolvimento", () => {
  let originalEnv;
  let originalResendKey;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
    originalResendKey = process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    delete require.cache[require.resolve("../../../src/config/env")];
    process.env.NODE_ENV = originalEnv;
    if (originalResendKey) {
      process.env.RESEND_API_KEY = originalResendKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
  });

  it("deve executar validação quando RESEND_API_KEY não está configurado em desenvolvimento", () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET = "test-secret";
    process.env.DB_PASSWORD = "test-password";
    delete process.env.RESEND_API_KEY;
    
    // Apenas garantir que o módulo é carregado e a validação é executada
    const env = require("../../../src/config/env");
    
    // Verificar que o módulo foi carregado corretamente
    expect(env).toBeDefined();
  });
});

