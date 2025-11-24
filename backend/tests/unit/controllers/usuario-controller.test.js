const { createModelMock, setupTransactionMock } = require("../../helpers/mockFactory");

// Criar mocks ANTES de importar
const mockUsuario = createModelMock();
const mockBcryptHash = jest.fn();
const mockBcryptCompare = jest.fn();

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Usuario: mockUsuario,
  Cliente: {},
  Autopeca: {},
  Vendedor: {},
  sequelize: {
    transaction: jest.fn(),
  },
}));

// Mock do bcrypt
jest.mock("bcryptjs", () => ({
  hash: mockBcryptHash,
  compare: mockBcryptCompare,
  genSalt: jest.fn(),
}));

// Importar APÓS os mocks
const UsuarioController = require("../../../src/controllers/usuarioController");
const { Usuario } = require("../../../src/models");
const bcrypt = require("bcryptjs");

describe("UsuarioController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    // Limpar mocks individuais
    mockUsuario.findOne.mockClear();
    mockBcryptHash.mockClear();
    mockBcryptCompare.mockClear();
    
    // Reconfigurar transaction
    mockTransaction = setupTransactionMock(mockUsuario);
    
    req = {
      user: { userId: 1, tipo: "cliente" },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("updateProfile", () => {
    it("deve retornar erro quando nenhum campo válido é fornecido", async () => {
      req.body = {};

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Nenhum campo válido para atualização",
        errors: {
          campos:
            "Forneça 'email' para atualizar email ou 'senha_atual' e 'nova_senha' para atualizar senha",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é encontrado", async () => {
      req.body = { email: "novo@email.com" };
      mockUsuario.findOne.mockResolvedValue(null);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Usuário não encontrado",
        errors: {
          usuario: "Usuário não encontrado no sistema",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando conta está inativa", async () => {
      req.body = { email: "novo@email.com" };
      const mockUsuarioInativo = {
        id: 1,
        email: "test@test.com",
        ativo: false,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioInativo);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Conta inativa",
        errors: {
          conta: "Sua conta está inativa. Entre em contato com o suporte.",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve atualizar email com sucesso", async () => {
      req.body = { email: "novo@email.com" };
      const mockUsuarioAtual = {
        id: 1,
        email: "antigo@email.com",
        ativo: true,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true),
      };
      mockUsuario.findOne
        .mockResolvedValueOnce(mockUsuarioAtual)
        .mockResolvedValueOnce(null); // Email não existe

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Email atualizado com sucesso",
        data: expect.objectContaining({
          usuario: expect.objectContaining({
            id: 1,
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando email já está em uso", async () => {
      req.body = { email: "existente@email.com" };
      const mockUsuarioAtual = {
        id: 1,
        email: "antigo@email.com",
        ativo: true,
      };
      const mockUsuarioExistente = {
        id: 2,
        email: "existente@email.com",
      };
      mockUsuario.findOne
        .mockResolvedValueOnce(mockUsuarioAtual)
        .mockResolvedValueOnce(mockUsuarioExistente);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          email: "Este email já está sendo usado por outro usuário",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando formato de email é inválido", async () => {
      req.body = { email: "email-invalido" };
      const mockUsuarioAtual = {
        id: 1,
        email: "antigo@email.com",
        ativo: true,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioAtual);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          email: "Formato de email inválido",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve atualizar senha com sucesso", async () => {
      req.body = {
        senha_atual: "senha123",
        nova_senha: "novaSenha456",
      };
      const mockUsuarioAtual = {
        id: 1,
        email: "test@test.com",
        senha_hash: "hashedPassword",
        ativo: true,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true),
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioAtual);
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("newHashedPassword");

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Senha atualizada com sucesso",
        data: expect.objectContaining({
          usuario: expect.objectContaining({
            id: 1,
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando senha_atual não é fornecida", async () => {
      req.body = { nova_senha: "novaSenha456" };
      const mockUsuarioAtual = {
        id: 1,
        email: "test@test.com",
        ativo: true,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioAtual);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          senha_atual: "Senha atual é obrigatória para alterar a senha",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando senha_atual está incorreta", async () => {
      req.body = {
        senha_atual: "senhaErrada",
        nova_senha: "novaSenha456",
      };
      const mockUsuarioAtual = {
        id: 1,
        email: "test@test.com",
        senha_hash: "hashedPassword",
        ativo: true,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioAtual);
      mockBcryptCompare.mockResolvedValue(false);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          senha_atual: "Senha atual incorreta",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando nova_senha é muito curta", async () => {
      req.body = {
        senha_atual: "senha123",
        nova_senha: "123",
      };
      const mockUsuarioAtual = {
        id: 1,
        email: "test@test.com",
        senha_hash: "hashedPassword",
        ativo: true,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioAtual);
      mockBcryptCompare.mockResolvedValue(true);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          nova_senha: "A nova senha deve ter pelo menos 6 caracteres",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve atualizar email e senha simultaneamente", async () => {
      req.body = {
        email: "novo@email.com",
        senha_atual: "senha123",
        nova_senha: "novaSenha456",
      };
      const mockUsuarioAtual = {
        id: 1,
        email: "antigo@email.com",
        senha_hash: "hashedPassword",
        ativo: true,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true),
      };
      mockUsuario.findOne
        .mockResolvedValueOnce(mockUsuarioAtual)
        .mockResolvedValueOnce(null);
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("newHashedPassword");

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Email e senha atualizados com sucesso",
        data: expect.objectContaining({
          usuario: expect.objectContaining({
            id: 1,
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando email é igual ao atual", async () => {
      req.body = { email: "test@test.com" };
      const mockUsuarioAtual = {
        id: 1,
        email: "test@test.com",
        ativo: true,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioAtual);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Nenhuma alteração detectada",
        errors: {
          campos: "Os dados fornecidos são iguais aos dados atuais",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve tratar erro de validação do Sequelize", async () => {
      req.body = { email: "novo@email.com" };
      const mockUsuarioAtual = {
        id: 1,
        email: "antigo@email.com",
        ativo: true,
        update: jest.fn().mockRejectedValue({
          name: "SequelizeValidationError",
          errors: [{ path: "email", message: "Email inválido" }],
        }),
      };
      mockUsuario.findOne
        .mockResolvedValueOnce(mockUsuarioAtual)
        .mockResolvedValueOnce(null);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro de validação nos dados",
        errors: {
          email: "Email inválido",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve tratar erro de unique constraint", async () => {
      req.body = { email: "novo@email.com" };
      const mockUsuarioAtual = {
        id: 1,
        email: "antigo@email.com",
        ativo: true,
        update: jest.fn().mockRejectedValue({
          name: "SequelizeUniqueConstraintError",
        }),
      };
      mockUsuario.findOne
        .mockResolvedValueOnce(mockUsuarioAtual)
        .mockResolvedValueOnce(null);

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Conflito de dados",
        errors: {
          email: "Este email já está sendo usado por outro usuário",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 500 quando ocorre erro genérico", async () => {
      req.body = { email: "novo@email.com" };
      mockUsuario.findOne.mockRejectedValue(new Error("Database error"));

      await UsuarioController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("deleteAccount", () => {
    it("deve retornar erro quando confirmação não é fornecida", async () => {
      req.body = { senha: "123456" };

      await UsuarioController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Confirmação inválida",
        errors: {
          confirmacao: 'Para excluir sua conta, você deve digitar "CONFIRMAR" no campo de confirmação',
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando confirmação está incorreta", async () => {
      req.body = { confirmacao: "EXCLUIR", senha: "123456" };

      await UsuarioController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Confirmação inválida",
        errors: {
          confirmacao: 'Para excluir sua conta, você deve digitar "CONFIRMAR" no campo de confirmação',
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando tipo é vendedor", async () => {
      req.user.tipo = "vendedor";
      req.body = { confirmacao: "CONFIRMAR", senha: "123456" };

      await UsuarioController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Operação não permitida",
        errors: {
          conta: "Vendedores não podem excluir a própria conta. Solicite ao administrador da autopeça.",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é encontrado", async () => {
      req.body = { confirmacao: "CONFIRMAR", senha: "123456" };
      mockUsuario.findOne.mockResolvedValue(null);

      await UsuarioController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Usuário não encontrado",
        errors: {
          usuario: "Usuário não encontrado no sistema",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando senha não é fornecida para conta não-OAuth", async () => {
      req.body = { confirmacao: "CONFIRMAR" };
      const mockUsuarioData = {
        id: 1,
        email: "test@test.com",
        senha_hash: "hashed_password",
        google_id: null,
        ativo: true,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioData);

      await UsuarioController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Senha obrigatória",
        errors: {
          senha: "Senha é obrigatória para excluir a conta",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando senha está incorreta", async () => {
      req.body = { confirmacao: "CONFIRMAR", senha: "senhaErrada" };
      const mockUsuarioData = {
        id: 1,
        email: "test@test.com",
        senha_hash: "hashed_password",
        google_id: null,
        ativo: true,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioData);
      mockBcryptCompare.mockResolvedValue(false);

      await UsuarioController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Senha incorreta",
        errors: {
          senha: "Senha incorreta. Por favor, verifique sua senha e tente novamente.",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando conta já está inativa", async () => {
      req.body = { confirmacao: "CONFIRMAR", senha: "senha123" };
      const mockUsuarioData = {
        id: 1,
        email: "test@test.com",
        senha_hash: "hashed_password",
        google_id: null,
        ativo: false,
      };
      mockUsuario.findOne.mockResolvedValue(mockUsuarioData);
      mockBcryptCompare.mockResolvedValue(true);

      await UsuarioController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Conta já desativada",
        errors: {
          conta: "Sua conta já está desativada",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });


    it("deve retornar erro 500 quando ocorre erro na exclusão", async () => {
      req.body = { confirmacao: "CONFIRMAR", senha: "senha123" };
      mockUsuario.findOne.mockRejectedValue(new Error("Database error"));

      await UsuarioController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});
