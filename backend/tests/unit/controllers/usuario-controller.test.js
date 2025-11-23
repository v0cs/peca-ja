const UsuarioController = require("../../../src/controllers/usuarioController");
const { Usuario } = require("../../../src/models");
const bcrypt = require("bcryptjs");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Usuario: {
    sequelize: {
      transaction: jest.fn(),
    },
    findOne: jest.fn(),
  },
  Cliente: {},
  Autopeca: {},
  Vendedor: {},
}));

// Mock do bcrypt
jest.mock("bcryptjs");

describe("UsuarioController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { userId: 1, tipo: "cliente" },
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
    Usuario.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
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
      Usuario.findOne.mockResolvedValue(null);

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

    it("deve retornar erro quando usuário não é encontrado", async () => {
      req.body = { confirmacao: "CONFIRMAR", senha: "123456" };
      Usuario.findOne.mockResolvedValue(null);

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
      const mockUsuario = {
        id: 1,
        email: "test@test.com",
        senha_hash: "hashed_password",
        google_id: null,
        ativo: true,
      };
      Usuario.findOne.mockResolvedValue(mockUsuario);

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
  });
});
