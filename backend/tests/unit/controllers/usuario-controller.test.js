const UsuarioController = require("../../../src/controllers/usuarioController");
const { Usuario, Cliente, Autopeca, Vendedor, Solicitacao } = require("../../../src/models");
const bcrypt = require("bcryptjs");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Usuario: {
    sequelize: {
      transaction: jest.fn(() => ({
        commit: jest.fn(),
        rollback: jest.fn(),
      })),
    },
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Cliente: {
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Autopeca: {
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Vendedor: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
  Solicitacao: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock do emailService
jest.mock("../../../src/services", () => ({
  emailService: {
    sendSecurityNotification: jest.fn().mockResolvedValue({}),
    sendAccountDeletionEmail: jest.fn().mockResolvedValue({}),
  },
}));

// Mock do bcrypt
jest.mock("bcryptjs");

describe("UsuarioController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        userId: 1,
        tipo: "cliente",
      },
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

    Usuario.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe("updateProfile", () => {
    it("deve atualizar email com sucesso", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        tipo_usuario: "cliente",
        ativo: true,
        reload: jest.fn().mockImplementation(function() {
          this.email = "novoemail@teste.com";
          return Promise.resolve(this);
        }),
        update: jest.fn().mockResolvedValue(true),
      };

      req.body = { email: "novoemail@teste.com" };

      Usuario.findOne
        .mockResolvedValueOnce(mockUsuario) // Buscar usuário atual
        .mockResolvedValueOnce(null); // Verificar se email já existe

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Email atualizado com sucesso",
        data: {
          usuario: expect.objectContaining({
            id: 1,
            email: "novoemail@teste.com",
          }),
        },
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve atualizar senha com sucesso", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        tipo_usuario: "cliente",
        ativo: true,
        reload: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true),
      };

      req.body = {
        senha_atual: "123456",
        nova_senha: "novaSenha123",
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue("newHashedPassword");

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Senha atualizada com sucesso",
        data: {
          usuario: expect.objectContaining({
            id: 1,
          }),
        },
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando nenhum campo é fornecido", async () => {
      // Arrange
      req.body = {};

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Nenhum campo válido para atualização",
        errors: {
          campos: expect.stringContaining("Forneça 'email'"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando email tem formato inválido", async () => {
      // Arrange
      req.body = { email: "email-invalido" };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        ativo: true,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
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

    it("deve retornar erro 400 quando email já está em uso", async () => {
      // Arrange
      req.body = { email: "emailusado@teste.com" };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        ativo: true,
      };

      const mockUsuarioComEmail = {
        id: 2,
        email: "emailusado@teste.com",
      };

      Usuario.findOne
        .mockResolvedValueOnce(mockUsuario)
        .mockResolvedValueOnce(mockUsuarioComEmail);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
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

    it("deve retornar erro 400 quando senha atual não é fornecida", async () => {
      // Arrange
      req.body = { nova_senha: "novaSenha123" };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        ativo: true,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
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

    it("deve retornar erro 400 quando senha atual está incorreta", async () => {
      // Arrange
      req.body = {
        senha_atual: "senhaErrada",
        nova_senha: "novaSenha123",
      };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        ativo: true,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
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

    it("deve retornar erro 400 quando nova senha é muito curta", async () => {
      // Arrange
      req.body = {
        senha_atual: "123456",
        nova_senha: "12345",
      };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        ativo: true,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
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

    it("deve retornar erro 404 quando usuário não é encontrado", async () => {
      // Arrange
      req.body = { email: "novoemail@teste.com" };
      Usuario.findOne.mockResolvedValue(null);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 403 quando conta está inativa", async () => {
      // Arrange
      req.body = { email: "novoemail@teste.com" };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        ativo: false,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      req.body = { email: "novoemail@teste.com" };
      Usuario.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando não há alteração detectada (email igual)", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        tipo_usuario: "cliente",
        ativo: true,
      };

      req.body = { email: "cliente@teste.com" };

      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
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

    it("deve atualizar email e senha juntos com sucesso", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        tipo_usuario: "cliente",
        ativo: true,
        reload: jest.fn().mockImplementation(function() {
          this.email = "novoemail@teste.com";
          return Promise.resolve(this);
        }),
        update: jest.fn().mockResolvedValue(true),
      };

      req.body = {
        email: "novoemail@teste.com",
        senha_atual: "123456",
        nova_senha: "novaSenha123",
      };

      Usuario.findOne
        .mockResolvedValueOnce(mockUsuario) // Buscar usuário atual
        .mockResolvedValueOnce(null); // Verificar se email já existe

      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue("newHashedPassword");

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Email e senha atualizados com sucesso",
        data: {
          usuario: expect.objectContaining({
            id: 1,
          }),
        },
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando ocorre SequelizeValidationError", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        tipo_usuario: "cliente",
        ativo: true,
        update: jest.fn().mockRejectedValue({
          name: "SequelizeValidationError",
          errors: [
            { path: "email", message: "Email inválido" },
          ],
        }),
      };

      req.body = { email: "novoemail@teste.com" };

      Usuario.findOne
        .mockResolvedValueOnce(mockUsuario)
        .mockResolvedValueOnce(null);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
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

    it("deve retornar erro 409 quando ocorre SequelizeUniqueConstraintError", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        tipo_usuario: "cliente",
        ativo: true,
        update: jest.fn().mockRejectedValue({
          name: "SequelizeUniqueConstraintError",
        }),
      };

      req.body = { email: "novoemail@teste.com" };

      Usuario.findOne
        .mockResolvedValueOnce(mockUsuario)
        .mockResolvedValueOnce(null);

      // Act
      await UsuarioController.updateProfile(req, res);

      // Assert
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
  });

  describe("deleteAccount", () => {
    it("deve excluir conta de cliente com sucesso", async () => {
      // Arrange
      req.body = {
        confirmacao: "CONFIRMAR",
        senha: "123456",
      };

      const mockCliente = {
        id: 1,
        nome_completo: "João Silva",
        update: jest.fn().mockResolvedValue(true),
      };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        tipo_usuario: "cliente",
        senha_hash: "hashedPassword",
        google_id: null,
        ativo: true,
        cliente: mockCliente,
        autopeca: null,
        update: jest.fn().mockImplementation(function(dados) {
          if (dados.ativo !== undefined) {
            this.ativo = dados.ativo;
          }
          return Promise.resolve(this);
        }),
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);
      Solicitacao.findAll.mockResolvedValue([]);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Conta excluída com sucesso",
        data: {
          usuario: expect.objectContaining({
            id: 1,
            ativo: false,
          }),
        },
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve excluir conta OAuth sem senha", async () => {
      // Arrange
      req.body = {
        confirmacao: "CONFIRMAR",
      };

      const mockCliente = {
        id: 1,
        nome_completo: "João Silva",
        update: jest.fn().mockResolvedValue(true),
      };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        tipo_usuario: "cliente",
        google_id: "google123",
        ativo: true,
        cliente: mockCliente,
        autopeca: null,
        update: jest.fn().mockResolvedValue(true),
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      Solicitacao.findAll.mockResolvedValue([]);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro 403 quando usuário é vendedor", async () => {
      // Arrange
      req.user.tipo = "vendedor";
      req.body = {
        confirmacao: "CONFIRMAR",
      };

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Operação não permitida",
        errors: {
          conta: expect.stringContaining("Vendedores não podem excluir"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando confirmação é inválida", async () => {
      // Arrange
      req.body = {
        confirmacao: "INVALIDO",
      };

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando senha não é fornecida (não OAuth)", async () => {
      // Arrange
      req.body = {
        confirmacao: "CONFIRMAR",
      };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        google_id: null,
        cliente: null,
        autopeca: null,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
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

    it("deve retornar erro 400 quando senha está incorreta", async () => {
      // Arrange
      req.body = {
        confirmacao: "CONFIRMAR",
        senha: "senhaErrada",
      };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        google_id: null,
        ativo: true,
        cliente: null,
        autopeca: null,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Senha incorreta",
        errors: {
          senha: expect.stringContaining("Senha incorreta"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando conta já está desativada", async () => {
      // Arrange
      req.body = {
        confirmacao: "CONFIRMAR",
        senha: "123456",
      };

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        senha_hash: "hashedPassword",
        google_id: null,
        ativo: false,
        cliente: null,
        autopeca: null,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve cancelar solicitações ativas ao excluir conta de cliente", async () => {
      // Arrange
      req.body = {
        confirmacao: "CONFIRMAR",
        senha: "123456",
      };

      const mockCliente = {
        id: 1,
        nome_completo: "João Silva",
        update: jest.fn().mockResolvedValue(true),
      };

      const mockSolicitacoes = [
        {
          id: 1,
          cliente_id: 1,
          status_cliente: "ativa",
        },
        {
          id: 2,
          cliente_id: 1,
          status_cliente: "ativa",
        },
      ];

      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        tipo_usuario: "cliente",
        senha_hash: "hashedPassword",
        google_id: null,
        ativo: true,
        cliente: mockCliente,
        autopeca: null,
        update: jest.fn().mockResolvedValue(true),
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);
      Solicitacao.findAll.mockResolvedValue(mockSolicitacoes);
      Solicitacao.update.mockResolvedValue([2]);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(Solicitacao.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status_cliente: "cancelada",
        }),
        expect.any(Object)
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro 404 quando usuário não é encontrado", async () => {
      // Arrange
      req.body = {
        confirmacao: "CONFIRMAR",
        senha: "123456",
      };

      Usuario.findOne.mockResolvedValue(null);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      req.body = {
        confirmacao: "CONFIRMAR",
        senha: "123456",
      };

      Usuario.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve excluir conta de autopeça com sucesso e desativar vendedores", async () => {
      // Arrange
      req.user.tipo = "autopeca";
      req.body = {
        confirmacao: "CONFIRMAR",
        senha: "123456",
      };

      const mockVendedor1 = {
        id: 1,
        ativo: true,
        usuario: {
          id: 10,
          ativo: true,
          update: jest.fn().mockResolvedValue(true),
        },
        update: jest.fn().mockResolvedValue(true),
      };

      const mockVendedor2 = {
        id: 2,
        ativo: true,
        usuario: {
          id: 11,
          ativo: true,
          update: jest.fn().mockResolvedValue(true),
        },
        update: jest.fn().mockResolvedValue(true),
      };

      const mockAutopeca = {
        id: 1,
        razao_social: "Auto Peças LTDA",
        nome_fantasia: "Auto Peças Silva",
        update: jest.fn().mockResolvedValue(true),
      };

      const mockUsuario = {
        id: 1,
        email: "autopeca@teste.com",
        tipo_usuario: "autopeca",
        senha_hash: "hashedPassword",
        google_id: null,
        ativo: true,
        cliente: null,
        autopeca: mockAutopeca,
        update: jest.fn().mockImplementation(function(dados) {
          if (dados.ativo !== undefined) {
            this.ativo = dados.ativo;
          }
          return Promise.resolve(this);
        }),
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);
      Vendedor.findAll.mockResolvedValue([mockVendedor1, mockVendedor2]);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(Vendedor.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            autopeca_id: 1,
            ativo: true,
          }),
          include: expect.any(Array),
          transaction: expect.any(Object),
        })
      );
      expect(mockVendedor1.update).toHaveBeenCalledWith(
        { ativo: false },
        expect.any(Object)
      );
      expect(mockVendedor2.update).toHaveBeenCalledWith(
        { ativo: false },
        expect.any(Object)
      );
    });

    it("deve excluir conta de autopeça sem vendedores vinculados", async () => {
      // Arrange
      req.user.tipo = "autopeca";
      req.body = {
        confirmacao: "CONFIRMAR",
        senha: "123456",
      };

      const mockAutopeca = {
        id: 1,
        razao_social: "Auto Peças LTDA",
        nome_fantasia: "Auto Peças Silva",
        update: jest.fn().mockResolvedValue(true),
      };

      const mockUsuario = {
        id: 1,
        email: "autopeca@teste.com",
        tipo_usuario: "autopeca",
        senha_hash: "hashedPassword",
        google_id: null,
        ativo: true,
        cliente: null,
        autopeca: mockAutopeca,
        update: jest.fn().mockImplementation(function(dados) {
          if (dados.ativo !== undefined) {
            this.ativo = dados.ativo;
          }
          return Promise.resolve(this);
        }),
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);
      Vendedor.findAll.mockResolvedValue([]);

      // Act
      await UsuarioController.deleteAccount(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });
});

