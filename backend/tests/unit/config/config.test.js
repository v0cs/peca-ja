describe("Config", () => {
  let config;

  beforeEach(() => {
    jest.resetModules();
    config = require("../../../src/config/config");
  });

  describe("toNumber", () => {
    it("deve converter string numérica para número", () => {
      // DB_PORT deve ser convertido de string para número
      expect(typeof config.development.port).toBe("number");
      expect(config.development.port).toBeGreaterThan(0);
    });

    it("deve ter port configurado corretamente", () => {
      // Port deve ser um número válido (5432 ou outro)
      expect(config.development.port).toBeDefined();
      expect(Number.isInteger(config.development.port)).toBe(true);
    });
  });

  describe("Configurações de ambiente", () => {
    it("deve ter configuração de development", () => {
      expect(config.development).toBeDefined();
      expect(config.development.dialect).toBe("postgres");
      expect(config.development.logging).toBe(false);
    });

    it("deve ter configuração de test", () => {
      expect(config.test).toBeDefined();
      expect(config.test.dialect).toBe("postgres");
      expect(config.test.logging).toBe(false);
    });

    it("deve ter configuração de production", () => {
      expect(config.production).toBeDefined();
      expect(config.production.dialect).toBe("postgres");
      expect(config.production.logging).toBe(false);
      expect(config.production.use_env_variable).toBe("DATABASE_URL");
    });

    it("deve ter SSL configurado em production", () => {
      expect(config.production.dialectOptions).toBeDefined();
      expect(config.production.dialectOptions.ssl).toBeDefined();
      expect(config.production.dialectOptions.ssl.require).toBe(true);
      expect(config.production.dialectOptions.ssl.rejectUnauthorized).toBe(
        false
      );
    });

    it("deve ter database configurado em development", () => {
      expect(config.development.database).toBeDefined();
      expect(typeof config.development.database).toBe("string");
    });

    it("deve ter database configurado em test", () => {
      expect(config.test.database).toBeDefined();
      expect(typeof config.test.database).toBe("string");
    });

    it("deve compartilhar configurações base entre development e test", () => {
      expect(config.development.username).toBe(config.test.username);
      expect(config.development.password).toBe(config.test.password);
      expect(config.development.host).toBe(config.test.host);
      expect(config.development.port).toBe(config.test.port);
      expect(config.development.dialect).toBe(config.test.dialect);
      expect(config.development.logging).toBe(config.test.logging);
    });

    it("deve ter username, password e host configurados", () => {
      expect(config.development.username).toBeDefined();
      expect(config.development.password).toBeDefined();
      expect(config.development.host).toBeDefined();
    });
  });
});

