const { isValidEmail, sanitizeEmail } = require("../../../src/utils/email");

describe("Email Utils", () => {
  describe("sanitizeEmail", () => {
    it("deve retornar string vazia quando valor não é string", () => {
      expect(sanitizeEmail(null)).toBe("");
      expect(sanitizeEmail(undefined)).toBe("");
      expect(sanitizeEmail(123)).toBe("");
      expect(sanitizeEmail({})).toBe("");
      expect(sanitizeEmail([])).toBe("");
    });

    it("deve remover espaços em branco do início e fim", () => {
      expect(sanitizeEmail("  teste@email.com  ")).toBe("teste@email.com");
      expect(sanitizeEmail(" teste@email.com")).toBe("teste@email.com");
      expect(sanitizeEmail("teste@email.com ")).toBe("teste@email.com");
      expect(sanitizeEmail("   ")).toBe("");
    });

    it("deve retornar string vazia quando valor é string vazia", () => {
      expect(sanitizeEmail("")).toBe("");
    });

    it("deve retornar string normal quando não há espaços", () => {
      expect(sanitizeEmail("teste@email.com")).toBe("teste@email.com");
    });
  });

  describe("isValidEmail", () => {
    it("deve retornar false quando valor não é string", () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail({})).toBe(false);
    });

    it("deve retornar false quando email está vazio ou só tem espaços", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("   ")).toBe(false);
    });

    it("deve retornar true para emails válidos", () => {
      expect(isValidEmail("teste@email.com")).toBe(true);
      expect(isValidEmail("usuario@dominio.com.br")).toBe(true);
      expect(isValidEmail("nome.sobrenome@empresa.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.com")).toBe(true);
      expect(isValidEmail("test123@test-domain.com")).toBe(true);
    });

    it("deve retornar false para emails inválidos", () => {
      expect(isValidEmail("email-sem-arroba.com")).toBe(false);
      expect(isValidEmail("@email.com")).toBe(false);
      expect(isValidEmail("email@")).toBe(false);
      expect(isValidEmail("email@.com")).toBe(false);
      expect(isValidEmail("email@com")).toBe(false);
      expect(isValidEmail("email sem espacos@com.com")).toBe(false);
    });

    it("deve remover espaços antes de validar", () => {
      expect(isValidEmail("  teste@email.com  ")).toBe(true);
      expect(isValidEmail(" teste@email.com")).toBe(true);
      expect(isValidEmail("teste@email.com ")).toBe(true);
    });

    it("deve retornar false para emails sem TLD", () => {
      expect(isValidEmail("teste@email")).toBe(false);
    });

    it("deve retornar false para emails com caracteres UTF-8 no local part", () => {
      // validator.isEmail com allow_utf8_local_part: false deve rejeitar
      expect(isValidEmail("testé@email.com")).toBe(false);
      expect(isValidEmail("tëst@email.com")).toBe(false);
    });
  });
});



