// Mock do Resend ANTES de qualquer require
jest.mock("resend", () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

// Mock do config/env ANTES de qualquer require
jest.mock("../../../src/config/env", () => ({
  RESEND_API_KEY: "test-api-key",
  emailFrom: "test@example.com",
  frontendURL: "http://localhost:3000",
  NODE_ENV: "test",
  PORT: 3001,
  isProduction: false,
}));

const controllers = require("../../../src/controllers");

describe("Controllers Index", () => {
  it("deve exportar AuthController", () => {
    expect(controllers.AuthController).toBeDefined();
    // Controllers são objetos (instâncias de classes)
    expect(typeof controllers.AuthController === "object" || typeof controllers.AuthController === "function").toBe(true);
  });

  it("deve exportar SolicitacaoController", () => {
    expect(controllers.SolicitacaoController).toBeDefined();
    expect(typeof controllers.SolicitacaoController === "object" || typeof controllers.SolicitacaoController === "function").toBe(true);
  });

  it("deve exportar NotificationController", () => {
    expect(controllers.NotificationController).toBeDefined();
    expect(typeof controllers.NotificationController === "object" || typeof controllers.NotificationController === "function").toBe(true);
  });

  it("deve exportar AutopecaController", () => {
    expect(controllers.AutopecaController).toBeDefined();
    expect(typeof controllers.AutopecaController === "object" || typeof controllers.AutopecaController === "function").toBe(true);
  });

  it("deve exportar ClienteController", () => {
    expect(controllers.ClienteController).toBeDefined();
    expect(typeof controllers.ClienteController === "object" || typeof controllers.ClienteController === "function").toBe(true);
  });

  it("deve exportar UsuarioController", () => {
    expect(controllers.UsuarioController).toBeDefined();
    expect(typeof controllers.UsuarioController === "object" || typeof controllers.UsuarioController === "function").toBe(true);
  });

  it("deve exportar VehicleController", () => {
    expect(controllers.VehicleController).toBeDefined();
    expect(typeof controllers.VehicleController === "object" || typeof controllers.VehicleController === "function").toBe(true);
  });

  it("deve exportar VendedorController", () => {
    expect(controllers.VendedorController).toBeDefined();
    expect(typeof controllers.VendedorController === "object" || typeof controllers.VendedorController === "function").toBe(true);
  });

  it("deve exportar VendedorOperacoesController", () => {
    expect(controllers.VendedorOperacoesController).toBeDefined();
    expect(typeof controllers.VendedorOperacoesController === "object" || typeof controllers.VendedorOperacoesController === "function").toBe(true);
  });

  it("deve exportar todos os controllers necessários", () => {
    const expectedControllers = [
      "AuthController",
      "SolicitacaoController",
      "NotificationController",
      "AutopecaController",
      "ClienteController",
      "UsuarioController",
      "VehicleController",
      "VendedorController",
      "VendedorOperacoesController",
    ];

    expectedControllers.forEach((controllerName) => {
      expect(controllers).toHaveProperty(controllerName);
      expect(controllers[controllerName]).toBeDefined();
    });
  });
});

