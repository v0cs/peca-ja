const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const AuthController = require("../../../src/controllers/authController");
const { Usuario, TokenRecuperacaoSenha } = require("../../../src/models");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Usuario: {
    sequelize: {
      transaction: jest.fn(),
    },
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  TokenRecuperacaoSenha: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

// Mock do bcrypt
jest.mock("bcryptjs");

// Mock do jwt
jest.mock("jsonwebtoken");

// Mock do crypto
jest.mock("crypto");

// Mock do emailService
jest.mock("../../../src/services", () => ({
  emailService: {
    sendPasswordResetEmail: jest.fn(),
    sendSecurityNotification: jest.fn(),
  },
}));

describe("AuthController - Recuperação de Senha", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    // Reconfigurar mock de transaction após clearAllMocks
    if (Usuario.sequelize) {
      Usuario.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
    }
  });

  describe("forgotPassword", () => {
    it("deve enviar email de recuperação de senha com sucesso", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "cliente",
      };

      req.body = { email: "teste@teste.com" };
      Usuario.findOne.mockResolvedValue(mockUsuario);
      crypto.randomBytes.mockReturnValue(Buffer.from("token-secreto"));
      TokenRecuperacaoSenha.create.mockResolvedValue({ id: 1 });

      // Act
      await AuthController.forgotPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining(
          "Se o email estiver cadastrado, você receberá instruções"
        ),
      });
      expect(TokenRecuperacaoSenha.create).toHaveBeenCalled();
    });

    it("deve retornar sucesso mesmo quando email não existe (não revelar)", async () => {
      // Arrange
      req.body = { email: "naoexiste@teste.com" };
      Usuario.findOne.mockResolvedValue(null);

      // Act
      await AuthController.forgotPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining(
          "Se o email estiver cadastrado, você receberá instruções"
        ),
      });
    });

    it("deve retornar erro quando email não é fornecido", async () => {
      // Arrange
      req.body = {};

      // Act
      await AuthController.forgotPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email é obrigatório",
        errors: {
          email: "Email é obrigatório",
        },
      });
    });

    it("deve retornar erro para email inválido", async () => {
      // Arrange
      req.body = { email: "email-invalido" };

      // Act
      await AuthController.forgotPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Formato de email inválido",
        errors: {
          email: "Formato de email inválido",
        },
      });
    });
  });

  describe("resetPassword", () => {
    beforeEach(() => {
      req.body = {
        token: "token-123",
        nova_senha: "novaSenha123",
      };
    });

    it("deve redefinir senha com sucesso", async () => {
      // Arrange
      const mockTokenRecuperacao = {
        id: 1,
        token: "token-123",
        utilizado: false,
        data_expiracao: new Date(Date.now() + 3600000), // 1 hora no futuro
        usuario: {
          id: 1,
          email: "teste@teste.com",
          update: jest.fn(),
        },
        update: jest.fn(),
      };

      TokenRecuperacaoSenha.findOne.mockResolvedValue(mockTokenRecuperacao);
      bcrypt.hash.mockResolvedValue("hashedNewPassword");

      // Act
      await AuthController.resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Senha redefinida com sucesso",
        data: {
          usuario: expect.objectContaining({
            id: 1,
            email: "teste@teste.com",
          }),
        },
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando token não é fornecido", async () => {
      // Arrange
      req.body = { nova_senha: "novaSenha123" };

      // Act
      await AuthController.resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token e nova senha são obrigatórios",
        errors: {
          token: "Token é obrigatório",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando nova senha não é fornecida", async () => {
      // Arrange
      req.body = { token: "token-123" };

      // Act
      await AuthController.resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token e nova senha são obrigatórios",
        errors: {
          nova_senha: "Nova senha é obrigatória",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando senha é muito curta", async () => {
      // Arrange
      req.body = { token: "token-123", nova_senha: "123" };

      // Act
      await AuthController.resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "A nova senha deve ter pelo menos 6 caracteres",
        errors: {
          nova_senha: "A senha deve ter pelo menos 6 caracteres",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando token é inválido", async () => {
      // Arrange
      TokenRecuperacaoSenha.findOne.mockResolvedValue(null);

      // Act
      await AuthController.resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token inválido ou expirado",
        errors: {
          token: "Token inválido ou já utilizado",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando token expirou", async () => {
      // Arrange
      const mockTokenRecuperacao = {
        id: 1,
        token: "token-123",
        utilizado: false,
        data_expiracao: new Date(Date.now() - 3600000), // 1 hora no passado
        usuario: {
          id: 1,
          email: "teste@teste.com",
        },
      };

      TokenRecuperacaoSenha.findOne.mockResolvedValue(mockTokenRecuperacao);

      // Act
      await AuthController.resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token expirado",
        errors: {
          token: "Token expirado. Solicite um novo link de recuperação",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("me", () => {
    beforeEach(() => {
      req.user = {
        userId: 1,
        tipo: "cliente",
      };
    });

    it("deve retornar informações do usuário logado (cliente)", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "cliente",
        ativo: true,
        termos_aceitos: true,
        data_aceite_terms: new Date(),
        consentimento_marketing: false,
        created_at: new Date(),
        updated_at: new Date(),
        cliente: {
          id: 1,
          nome_completo: "João Silva",
          telefone: "(11)99999-9999",
          celular: "(11)99999-9999",
          cidade: "São Paulo",
          uf: "SP",
          created_at: new Date(),
          updated_at: new Date(),
        },
        autopeca: null,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.me(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Informações do usuário recuperadas com sucesso",
        data: {
          usuario: expect.objectContaining({
            id: 1,
            email: "teste@teste.com",
            tipo_usuario: "cliente",
          }),
          cliente: expect.objectContaining({
            id: 1,
            nome_completo: "João Silva",
          }),
        },
      });
    });

    it("deve retornar erro quando usuário não é encontrado", async () => {
      // Arrange
      Usuario.findOne.mockResolvedValue(null);

      // Act
      await AuthController.me(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Usuário não encontrado",
        errors: {
          user: "Usuário não existe no sistema",
        },
      });
    });

    it("deve retornar erro quando conta está inativa", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        ativo: false,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.me(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Conta inativa",
        errors: {
          conta: "Sua conta está inativa. Entre em contato com o suporte.",
        },
      });
    });
  });

  describe("logout", () => {
    beforeEach(() => {
      req.user = {
        userId: 1,
        tipo: "cliente",
      };
    });

    it("deve fazer logout com sucesso", async () => {
      // Act
      await AuthController.logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Logout realizado com sucesso",
        data: {
          usuario_id: 1,
          tipo: "cliente",
          logout_timestamp: expect.any(String),
        },
      });
    });
  });
});



