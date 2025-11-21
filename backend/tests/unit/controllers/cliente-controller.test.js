const ClienteController = require("../../../src/controllers/clienteController");
const { Cliente, Usuario } = require("../../../src/models");
const bcrypt = require("bcryptjs");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Cliente: {
    sequelize: {
      transaction: jest.fn(() => ({
        commit: jest.fn(),
        rollback: jest.fn(),
      })),
    },
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Usuario: {
    findOne: jest.fn(),
  },
}));

describe("ClienteController", () => {
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

    Cliente.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe("getProfile", () => {
    it("deve buscar perfil do cliente com sucesso", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        tipo_usuario: "cliente",
        ativo: true,
        termos_aceitos: true,
        data_aceite_terms: new Date(),
        consentimento_marketing: true,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        nome_completo: "João Silva",
        telefone: "(11)1234-5678",
        celular: "(11)98765-4321",
        cidade: "São Paulo",
        uf: "SP",
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        usuario: mockUsuario,
      };

      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await ClienteController.getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Perfil do cliente recuperado com sucesso",
        data: {
          cliente: {
            id: 1,
            nome_completo: "João Silva",
            telefone: "(11)1234-5678",
            celular: "(11)98765-4321",
            cidade: "São Paulo",
            uf: "SP",
            created_at: mockCliente.data_criacao,
            updated_at: mockCliente.data_atualizacao,
          },
          usuario: {
            id: 1,
            email: "cliente@teste.com",
            tipo_usuario: "cliente",
            ativo: true,
            termos_aceitos: true,
            data_aceite_terms: mockUsuario.data_aceite_terms,
            consentimento_marketing: true,
            created_at: mockUsuario.data_criacao,
            updated_at: mockUsuario.data_atualizacao,
          },
        },
      });
    });

    it("deve retornar erro 403 quando usuário não é cliente", async () => {
      // Arrange
      req.user.tipo = "autopeca";

      // Act
      await ClienteController.getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para clientes",
        },
      });
    });

    it("deve retornar erro 404 quando cliente não é encontrado", async () => {
      // Arrange
      Cliente.findOne.mockResolvedValue(null);

      // Act
      await ClienteController.getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cliente não encontrado",
        errors: {
          cliente: "Perfil de cliente não encontrado para este usuário",
        },
      });
    });

    it("deve retornar erro 403 quando conta está inativa", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        tipo_usuario: "cliente",
        ativo: false,
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        usuario: mockUsuario,
      };

      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await ClienteController.getProfile(req, res);

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

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Cliente.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await ClienteController.getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
    });
  });

  describe("updateProfile", () => {
    const validUpdateData = {
      nome_completo: "João Silva Santos",
      telefone: "(11)1234-5678",
      celular: "(11)98765-4321",
      cidade: "Campinas",
      uf: "SP",
    };

    beforeEach(() => {
      req.body = validUpdateData;
    });

    it("deve atualizar perfil do cliente com sucesso", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        tipo_usuario: "cliente",
        ativo: true,
        termos_aceitos: true,
        data_aceite_terms: new Date(),
        consentimento_marketing: true,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        nome_completo: "João Silva",
        telefone: "(11)1111-1111",
        celular: "(11)99999-9999",
        cidade: "São Paulo",
        uf: "SP",
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        usuario: mockUsuario,
        update: jest.fn().mockResolvedValue(true),
      };

      Cliente.findOne
        .mockResolvedValueOnce(mockCliente) // Primeira chamada para buscar cliente
        .mockResolvedValueOnce({
          // Segunda chamada para buscar cliente atualizado
          ...mockCliente,
          nome_completo: validUpdateData.nome_completo,
          telefone: validUpdateData.telefone,
          celular: validUpdateData.celular,
          cidade: validUpdateData.cidade,
          uf: validUpdateData.uf,
          usuario: mockUsuario,
        });

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Perfil do cliente atualizado com sucesso",
        data: expect.objectContaining({
          cliente: expect.objectContaining({
            nome_completo: validUpdateData.nome_completo,
            cidade: validUpdateData.cidade,
            uf: validUpdateData.uf,
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro 403 quando usuário não é cliente", async () => {
      // Arrange
      req.user.tipo = "autopeca";

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando nenhum campo válido é fornecido", async () => {
      // Arrange
      req.body = { campo_invalido: "valor" };

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Nenhum campo válido para atualização",
        errors: {
          campos: expect.stringContaining("Campos permitidos"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando nome_completo é muito curto", async () => {
      // Arrange
      req.body = { nome_completo: "A" };

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          nome_completo: "Nome completo deve ter pelo menos 2 caracteres",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando telefone tem formato inválido", async () => {
      // Arrange
      req.body = { telefone: "123456789" };

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          telefone: expect.stringContaining("Formato de telefone inválido"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando celular tem formato inválido", async () => {
      // Arrange
      req.body = { celular: "123456789" };

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          celular: expect.stringContaining("Formato de celular inválido"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando UF é inválida", async () => {
      // Arrange
      req.body = { uf: "XX" };

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          uf: "UF inválida",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando cidade é muito curta", async () => {
      // Arrange
      req.body = { cidade: "A" };

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          cidade: "Nome da cidade deve ter pelo menos 2 caracteres",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 404 quando cliente não é encontrado", async () => {
      // Arrange
      Cliente.findOne.mockResolvedValue(null);

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 403 quando conta está inativa", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        ativo: false,
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        usuario: mockUsuario,
      };

      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Cliente.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve normalizar UF para maiúsculas", async () => {
      // Arrange
      req.body = { uf: "sp" };

      const mockUsuario = {
        id: 1,
        ativo: true,
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        usuario: mockUsuario,
        update: jest.fn().mockResolvedValue(true),
      };

      Cliente.findOne
        .mockResolvedValueOnce(mockCliente)
        .mockResolvedValueOnce({
          ...mockCliente,
          uf: "SP",
          usuario: mockUsuario,
        });

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando ocorre SequelizeValidationError", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        ativo: true,
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        usuario: mockUsuario,
        update: jest.fn().mockRejectedValue({
          name: "SequelizeValidationError",
          errors: [
            { path: "nome_completo", message: "Nome completo é obrigatório" },
          ],
        }),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro de validação nos dados",
        errors: {
          nome_completo: "Nome completo é obrigatório",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve normalizar telefone removendo caracteres especiais", async () => {
      // Arrange
      req.body = { telefone: "(11)98765-4321" };

      const mockUsuario = {
        id: 1,
        ativo: true,
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        usuario: mockUsuario,
        update: jest.fn().mockResolvedValue(true),
      };

      Cliente.findOne
        .mockResolvedValueOnce(mockCliente)
        .mockResolvedValueOnce({
          ...mockCliente,
          telefone: "(11)98765-4321",
          usuario: mockUsuario,
        });

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve normalizar celular removendo caracteres especiais", async () => {
      // Arrange
      req.body = { celular: "(11)98765-4321" };

      const mockUsuario = {
        id: 1,
        ativo: true,
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        usuario: mockUsuario,
        update: jest.fn().mockResolvedValue(true),
      };

      Cliente.findOne
        .mockResolvedValueOnce(mockCliente)
        .mockResolvedValueOnce({
          ...mockCliente,
          celular: "(11)98765-4321",
          usuario: mockUsuario,
        });

      // Act
      await ClienteController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });
});

