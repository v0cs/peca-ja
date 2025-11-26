// Testar getBaseConfig do env.js
describe("env.js - getBaseConfig", () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    delete require.cache[require.resolve("../../../src/config/env")];
    process.env.NODE_ENV = originalEnv;
    delete process.env.DOMAIN;
    delete process.env.BASE_URL;
    delete process.env.FRONTEND_URL;
    delete process.env.API_URL;
    delete process.env.EMAIL_FROM;
    delete process.env.APP_URL;
  });

  it("deve usar valores padrão em desenvolvimento quando variáveis não estão definidas", () => {
    process.env.NODE_ENV = "development";
    
    const env = require("../../../src/config/env");
    
    expect(env.domain).toBe("localhost");
    expect(env.baseURL).toBe("http://localhost:3000");
    expect(env.frontendURL).toBe("http://localhost:5173");
    expect(env.apiURL).toBe("http://localhost:3001/api");
    expect(env.emailFrom).toBe("PeçaJá <onboarding@resend.dev>");
  });

  it("deve usar valores padrão em desenvolvimento", () => {
    process.env.NODE_ENV = "development";
    
    const env = require("../../../src/config/env");
    
    // Apenas verificar que o módulo foi carregado e tem as propriedades
    expect(env.domain).toBe("localhost");
    expect(env.baseURL).toBeDefined();
    expect(env.frontendURL).toBeDefined();
    expect(env.apiURL).toBeDefined();
    expect(env.emailFrom).toBeDefined();
  });

});

