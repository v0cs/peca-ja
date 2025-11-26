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

const services = require("../../../src/services");

describe("Services Index", () => {
  it("deve exportar apiVeicularService", () => {
    expect(services.apiVeicularService).toBeDefined();
    expect(typeof services.apiVeicularService).toBe("object");
  });

  it("deve exportar emailService", () => {
    expect(services.emailService).toBeDefined();
    expect(typeof services.emailService).toBe("object");
  });

  it("deve exportar NotificationService", () => {
    expect(services.NotificationService).toBeDefined();
    // NotificationService é uma classe, então é uma function
    expect(typeof services.NotificationService).toBe("function");
  });

  it("deve exportar uploadService", () => {
    expect(services.uploadService).toBeDefined();
    expect(typeof services.uploadService).toBe("object");
  });

  it("deve exportar todos os serviços necessários", () => {
    const expectedServices = [
      "apiVeicularService",
      "emailService",
      "NotificationService",
      "uploadService",
    ];

    expectedServices.forEach((serviceName) => {
      expect(services).toHaveProperty(serviceName);
      expect(services[serviceName]).toBeDefined();
    });
  });
});

