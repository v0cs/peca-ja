// ⚠️ CRÍTICO: Mocks devem estar ANTES de qualquer require para evitar acionar Babel

// Mock do Resend ANTES de importar EmailService
const mockResendInstance = {
  emails: {
    send: jest.fn(),
  },
};

const mockResend = jest.fn(() => mockResendInstance);

jest.mock("resend", () => ({
  Resend: mockResend,
}));

// Mock do config - COMPLETO para evitar acionar Babel
// O config/env.js executa código no nível do módulo que pode acionar Babel
jest.mock("../../../src/config/env", () => {
  // Retornar um objeto completo que simula todas as propriedades do config
  // Sem executar código que possa acionar Babel
  return {
    RESEND_API_KEY: "test-api-key",
    emailFrom: "test@example.com",
    frontendURL: "http://localhost:3000",
    NODE_ENV: "test",
    PORT: 3001,
    isProduction: false,
    domain: "localhost",
    baseURL: "http://localhost:3000",
    apiURL: "http://localhost:3001/api",
    DB_HOST: "localhost",
    DB_PORT: 5432,
    DB_NAME: "test_db",
    DB_USER: "test_user",
    DB_PASSWORD: "test_password",
    JWT_SECRET: "test-secret",
    JWT_EXPIRES_IN: "24h",
    MAX_FILE_SIZE: 10485760,
    UPLOAD_PATH: "./uploads",
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    RATE_LIMIT_AUTH_MAX: 20,
    RATE_LIMIT_API_MAX: 500,
    RATE_LIMIT_UPLOAD_MAX: 20,
    RATE_LIMIT_SOLICITATION_MAX: 20,
    RATE_LIMIT_VENDEDOR_MAX: 10,
    API_VEICULAR_KEY: "test-key",
    API_VEICULAR_EMAIL: "test@example.com",
    API_VEICULAR_BASE_URL: "https://api.test.com",
    API_VEICULAR_TIMEOUT: 10000,
    API_VEICULAR_CACHE_TTL: 86400,
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    GOOGLE_CALLBACK_URL: "http://localhost:3001/api/auth/google/callback",
  };
});

// Importar EmailService DEPOIS dos mocks
const EmailService = require("../../../src/services/emailService");

describe("EmailService", () => {
  let emailService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // EmailService é exportado como instância única (singleton)
    emailService = EmailService;
    // Substituir resend pela instância mockada
    emailService.resend = mockResendInstance;
    // Garantir que sendEmail não está sendo spyado
    jest.restoreAllMocks();
  });

  describe("sendEmail", () => {
    it("deve enviar email com sucesso", async () => {
      // Arrange
      const mockResult = {
        data: { id: "email-123" },
      };
      mockResendInstance.emails.send.mockResolvedValue(mockResult);

      // Act
      const result = await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>"
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
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

      mockResendInstance.emails.send
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
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(2);
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

      mockResendInstance.emails.send.mockResolvedValue(rateLimitError);
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
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(2);
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

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
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

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
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

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
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

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
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

  describe("sendSecurityNotification", () => {
    it("deve enviar notificação de segurança para alteração de senha", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "usuario@teste.com",
        nome: "João Silva",
      };
      const mockResult = { data: { id: "email-123" } };

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendSecurityNotification(mockUsuario, {
        tipo: "senha",
      });

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "usuario@teste.com",
        expect.stringContaining("senha foi alterada"),
        expect.stringContaining("João")
      );
    });

    it("deve enviar notificação de segurança para alteração de email", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "novo@teste.com",
        nome: "João Silva",
      };
      const mockResult = { data: { id: "email-123" } };

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendSecurityNotification(mockUsuario, {
        tipo: "email",
        metadados: {
          novoEmail: "novo@teste.com",
          antigoEmail: "antigo@teste.com",
        },
      });

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "novo@teste.com",
        expect.stringContaining("Email da sua conta foi atualizado"),
        expect.stringContaining("João")
      );
    });

    it("deve retornar null quando tipo não é reconhecido", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "usuario@teste.com",
        nome: "João Silva",
      };
      // Criar spy antes de usar
      const sendEmailSpy = jest.spyOn(emailService, "sendEmail");

      // Act
      const result = await emailService.sendSecurityNotification(mockUsuario, {
        tipo: "tipo_invalido",
      });

      // Assert
      expect(result).toBeNull();
      expect(sendEmailSpy).not.toHaveBeenCalled();

      // Limpar spy
      sendEmailSpy.mockRestore();
    });

    it("deve usar email como nome quando nome não existe", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "usuario@teste.com",
      };
      const mockResult = { data: { id: "email-123" } };

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendSecurityNotification(mockUsuario, {
        tipo: "senha",
      });

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "usuario@teste.com",
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe("sendNewRequestNotification", () => {
    it("deve enviar notificação de nova solicitação", async () => {
      // Arrange
      const email = "autopeca@teste.com";
      const mockSolicitacao = {
        id: 1,
        descricao_peca: "Freio dianteiro",
        marca: "Toyota",
        modelo: "Corolla",
        ano_fabricacao: 2020,
        placa: "ABC1234",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
        created_at: new Date(),
      };
      const mockCliente = {
        id: 1,
        nome_completo: "João Cliente",
      };
      const nomeDestinatario = "Auto Peças Silva";
      const mockResult = { data: { id: "email-123" } };

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendNewRequestNotification(
        email,
        mockSolicitacao,
        mockCliente,
        nomeDestinatario
      );

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        email,
        expect.stringContaining("Nova Solicitação"),
        expect.stringContaining("Freio dianteiro"),
        expect.any(String) // text version
      );
    });
  });

  describe("sendAccountDeletionEmail", () => {
    it("deve enviar email de confirmação de exclusão de conta para cliente", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
      };
      const mockPerfilData = {
        nome_completo: "João Cliente",
      };
      const mockResult = { data: { id: "email-123" } };

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendAccountDeletionEmail(
        mockUsuario,
        mockPerfilData,
        "cliente"
      );

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "cliente@teste.com",
        expect.stringContaining("conta foi excluída"),
        expect.stringContaining("Olá, João!") // O código usa nome.split(" ")[0], então usa apenas "João"
      );
    });

    it("deve enviar email de confirmação de exclusão de conta para autopeça", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "autopeca@teste.com",
      };
      const mockPerfilData = {
        razao_social: "Auto Peças LTDA",
      };
      const mockResult = { data: { id: "email-123" } };

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendAccountDeletionEmail(
        mockUsuario,
        mockPerfilData,
        "autopeca"
      );

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "autopeca@teste.com",
        expect.stringContaining("conta foi excluída"),
        expect.stringContaining("Olá, Auto!") // O código usa nome.split(" ")[0], então usa apenas "Auto" de "Auto Peças LTDA"
      );
    });

    it("deve usar email como nome quando perfilData não tem nome", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "usuario@teste.com",
      };
      const mockPerfilData = {};
      const mockResult = { data: { id: "email-123" } };

      mockResendInstance.emails.send.mockResolvedValue(mockResult);
      jest.spyOn(emailService, "sendEmail").mockResolvedValue(mockResult);

      // Act
      await emailService.sendAccountDeletionEmail(
        mockUsuario,
        mockPerfilData,
        "cliente"
      );

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "usuario@teste.com",
        expect.stringContaining("conta foi excluída"),
        expect.any(String)
      );
    });
  });

  describe("htmlToText", () => {
    it("deve converter HTML para texto simples", () => {
      // Arrange
      const html = "<p>Texto de teste</p><div>Mais texto</div>";

      // Act
      const result = emailService.htmlToText(html);

      // Assert
      expect(result).toBe("Texto de testeMais texto");
      expect(result).not.toContain("<p>");
      expect(result).not.toContain("</p>");
      expect(result).not.toContain("<div>");
      expect(result).not.toContain("</div>");
    });

    it("deve remover múltiplas quebras de linha", () => {
      // Arrange
      const html = "<p>Texto 1</p>\n\n\n<p>Texto 2</p>";

      // Act
      const result = emailService.htmlToText(html);

      // Assert
      expect(result).not.toMatch(/\n{3,}/);
    });

    it("deve retornar string vazia quando HTML é vazio", () => {
      // Arrange
      const html = "";

      // Act
      const result = emailService.htmlToText(html);

      // Assert
      expect(result).toBe("");
    });

    it("deve remover tags HTML complexas", () => {
      // Arrange
      const html =
        '<div style="color: red;"><strong>Texto</strong> <em>importante</em></div>';

      // Act
      const result = emailService.htmlToText(html);

      // Assert
      expect(result).toBe("Texto importante");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });
  });

  describe("sendEmail - casos de borda", () => {
    beforeEach(() => {
      // Restaurar todos os spies antes dos testes de casos de borda
      jest.restoreAllMocks();
      // Garantir que resend está mockado
      emailService.resend = mockResendInstance;
    });

    it("deve tratar erro não relacionado a rate limit", async () => {
      // Arrange
      const errorResult = {
        error: {
          statusCode: 500,
          message: "Internal Server Error",
        },
      };

      mockResendInstance.emails.send.mockClear();
      mockResendInstance.emails.send.mockResolvedValue(errorResult);

      // Act
      const result = await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>"
      );

      // Assert
      expect(result.error).toBe("Internal Server Error");
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(1);
    });

    it("deve tratar exception de rate limit", async () => {
      // Arrange
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.statusCode = 429;
      rateLimitError.name = "rate_limit_exceeded";
      rateLimitError.response = {
        headers: { "retry-after": "1" },
      };

      const successResult = {
        data: { id: "email-123" },
      };

      mockResendInstance.emails.send.mockClear();
      mockResendInstance.emails.send
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(successResult);

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
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(2);
      expect(emailService.sleep).toHaveBeenCalled();
    });

    it("deve retornar erro após máximo de tentativas com exception", async () => {
      // Arrange
      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.statusCode = 429;
      rateLimitError.name = "rate_limit_exceeded";
      rateLimitError.response = {
        headers: { "retry-after": "1" },
      };

      mockResendInstance.emails.send.mockClear();
      mockResendInstance.emails.send.mockRejectedValue(rateLimitError);
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
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(2);
    });

    it("deve retornar erro genérico quando exception não é rate limit", async () => {
      // Arrange
      const error = new Error("Generic error");
      error.statusCode = 500;
      error.name = "generic_error"; // Não é rate_limit_exceeded

      mockResendInstance.emails.send.mockClear();
      mockResendInstance.emails.send.mockRejectedValue(error);

      // Act
      const result = await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>"
      );

      // Assert
      expect(result.error).toBe("Generic error");
      expect(result.rateLimit).toBeUndefined();
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(1);
    });

    it("deve usar texto customizado quando fornecido", async () => {
      // Arrange
      const mockResult = {
        data: { id: "email-123" },
      };
      mockResendInstance.emails.send.mockClear();
      mockResendInstance.emails.send.mockResolvedValue(mockResult);

      // Act
      await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>",
        "Texto customizado"
      );

      // Assert
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
        text: "Texto customizado",
      });
    });

    it("deve retornar ID do email quando disponível em result.id", async () => {
      // Arrange
      const mockResult = {
        id: "email-456", // ID direto no result (sem data)
      };
      // Limpar qualquer mock anterior
      jest.restoreAllMocks();
      emailService.resend = mockResendInstance;
      mockResendInstance.emails.send.mockClear();
      mockResendInstance.emails.send.mockResolvedValue(mockResult);

      // Act
      const result = await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>"
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(result.id).toBe("email-456");
    });

    it("deve tratar quando result não tem ID", async () => {
      // Arrange
      const mockResult = {}; // Result sem ID e sem data
      // Limpar qualquer mock anterior
      jest.restoreAllMocks();
      emailService.resend = mockResendInstance;
      mockResendInstance.emails.send.mockClear();
      mockResendInstance.emails.send.mockResolvedValue(mockResult);

      // Act
      const result = await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "<p>Test HTML</p>"
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(result.id).toBeUndefined();
      expect(result.data).toBeUndefined();
    });
  });
});
