const EmailService = require("../../../src/services/emailService");
const { Resend } = require("resend");

// Mock do Resend
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

// Mock do config
jest.mock("../../../src/config/env", () => ({
  RESEND_API_KEY: "test-api-key",
  emailFrom: "test@example.com",
  frontendURL: "http://localhost:3000",
}));

describe("EmailService", () => {
  let emailService;

  beforeEach(() => {
    jest.clearAllMocks();
    // EmailService é exportado como instância única (singleton)
    emailService = EmailService;
  });

  describe("sendEmail", () => {
    it("deve enviar email com sucesso", async () => {
      // Arrange
      const mockResult = {
        data: { id: "email-123" },
      };
      emailService.resend.emails.send.mockResolvedValue(mockResult);

      // Act
      const result = await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>"
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(emailService.resend.emails.send).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
        text: expect.any(String),
      });
    });

    it("deve fazer retry em caso de rate limit", async () => {
      // Arrange
      const rateLimitError = {
        error: {
          statusCode: 429,
          name: "rate_limit_exceeded",
          message: "Rate limit exceeded",
        },
        headers: { "retry-after": "1" },
      };

      const successResult = {
        data: { id: "email-123" },
      };

      emailService.resend.emails.send
        .mockResolvedValueOnce(rateLimitError)
        .mockResolvedValueOnce(successResult);

      // Mock sleep para não esperar
      jest.spyOn(emailService, "sleep").mockResolvedValue();

      // Act
      const result = await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>",
        null,
        3
      );

      // Assert
      expect(result).toEqual(successResult);
      expect(emailService.resend.emails.send).toHaveBeenCalledTimes(2);
      expect(emailService.sleep).toHaveBeenCalled();
    });

    it("deve retornar erro após máximo de tentativas", async () => {
      // Arrange
      const rateLimitError = {
        error: {
          statusCode: 429,
          name: "rate_limit_exceeded",
          message: "Rate limit exceeded",
        },
      };

      emailService.resend.emails.send.mockResolvedValue(rateLimitError);
      jest.spyOn(emailService, "sleep").mockResolvedValue();

      // Act
      const result = await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>",
        null,
        2
      );

      // Assert
      expect(result.error).toBe("Rate limit exceeded");
      expect(result.rateLimit).toBe(true);
      expect(emailService.resend.emails.send).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendWelcomeEmail", () => {
    it("deve enviar email de boas-vindas para cliente", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        tipo_usuario: "cliente",
      };
      const mockCliente = {
        id: 1,
        nome_completo: "João Silva",
      };
      const mockResult = { data: { id: "email-123" } };

      emailService.resend.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendWelcomeEmail(mockUsuario, mockCliente, "cliente");

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "cliente@teste.com",
        expect.stringContaining("Bem-vindo"),
        expect.stringContaining("João Silva")
      );
    });

    it("deve enviar email de boas-vindas para autopeça", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "autopeca@teste.com",
        tipo_usuario: "autopeca",
      };
      const mockAutopeca = {
        id: 1,
        razao_social: "Auto Peças LTDA",
      };
      const mockResult = { data: { id: "email-123" } };

      emailService.resend.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendWelcomeEmail(
        mockUsuario,
        mockAutopeca,
        "autopeca"
      );

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "autopeca@teste.com",
        expect.stringContaining("Bem-vindo"),
        expect.stringContaining("Auto Peças LTDA")
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("deve enviar email de recuperação de senha", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "usuario@teste.com",
        tipo_usuario: "cliente",
      };
      const resetToken = "test-reset-token";
      const mockResult = { data: { id: "email-123" } };

      emailService.resend.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendPasswordResetEmail(mockUsuario, resetToken);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "usuario@teste.com",
        expect.stringContaining("Redefinição de Senha"),
        expect.stringContaining(resetToken)
      );
    });
  });

  describe("sendVendorCredentials", () => {
    it("deve enviar email com credenciais do vendedor", async () => {
      // Arrange
      const email = "vendedor@teste.com";
      const nomeVendedor = "João Vendedor";
      const senhaTemporaria = "temp123";
      const nomeAutopeca = "Auto Peças LTDA";
      const mockResult = { data: { id: "email-123" } };

      emailService.resend.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendVendorCredentials(
        email,
        nomeVendedor,
        senhaTemporaria,
        nomeAutopeca
      );

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        email,
        expect.stringContaining("Credenciais"),
        expect.stringContaining(nomeVendedor)
      );
    });
  });
});

