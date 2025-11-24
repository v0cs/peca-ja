const { createModelMock, setupTransactionMock } = require("../../helpers/mockFactory");

// Criar mocks dos models ANTES de importar o controller
const mockVendedor = createModelMock();
const mockUsuario = createModelMock();
const mockAutopeca = createModelMock();
const mockCliente = createModelMock();

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Vendedor: mockVendedor,
  Usuario: mockUsuario,
  Autopeca: mockAutopeca,
  Cliente: mockCliente,
}));

// Mock do bcrypt
jest.mock("bcryptjs");
const bcrypt = require("bcryptjs");

// Mock do emailService
jest.mock("../../../src/services", () => ({
  emailService: {
    sendVendorCredentials: jest.fn(),
  },
}));

// Importar após os mocks
const VendedorController = require("../../../src/controllers/vendedorController");
const { Vendedor, Usuario, Autopeca, Cliente } = require("../../../src/models");

describe("VendedorController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    // Limpar mocks individuais
    Vendedor.findOne.mockClear();
    Vendedor.findAll.mockClear();
    Vendedor.create.mockClear();
    Vendedor.update.mockClear();
    Usuario.findOne.mockClear();
    Usuario.findByPk.mockClear();
    Usuario.create.mockClear();
    Usuario.update.mockClear();
    Autopeca.findOne.mockClear();
    Cliente.findOne.mockClear();
    
    // Reconfigurar transaction
    mockTransaction = setupTransactionMock(Usuario);

    req = {
      user: {
        userId: 1,
        tipo: "autopeca",
      },
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Manter referência para compatibilidade
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    // Reconfigurar mock de transaction após clearAllMocks
    if (Usuario.sequelize) {
      Usuario.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
    }
  });

  describe("criarVendedor", () => {
    const validVendedorData = {
      nome: "João Vendedor",
      email: "vendedor@teste.com",
    };

    beforeEach(() => {
      req.body = validVendedorData;
    });

    it("deve criar um vendedor com sucesso", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        razao_social: "Auto Peças LTDA",
        nome_fantasia: "Auto Peças Silva",
      };
      const mockUsuario = {
        id: 2,
        email: "vendedor@teste.com",
        tipo_usuario: "vendedor",
        ativo: true,
      };
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        data_criacao: new Date(),
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Usuario.findOne.mockResolvedValue(null); // Email não existe
      bcrypt.hash.mockResolvedValue("hashedPassword");
      Usuario.create.mockResolvedValue(mockUsuario);
      Vendedor.findOne.mockResolvedValue(null); // Não existe vendedor
      Vendedor.create.mockResolvedValue(mockVendedor);

      // Act
      await VendedorController.criarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendedor cadastrado com sucesso",
        data: expect.objectContaining({
          vendedor: expect.objectContaining({
            id: 1,
            nome_completo: "João Vendedor",
            ativo: true,
          }),
          usuario: expect.objectContaining({
            id: 2,
            email: "vendedor@teste.com",
            tipo_usuario: "vendedor",
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorController.criarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para autopeças",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando campos obrigatórios estão faltando", async () => {
      // Arrange
      req.body = { email: "vendedor@teste.com" }; // Nome faltando

      // Act
      await VendedorController.criarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Campos obrigatórios não fornecidos",
        errors: expect.objectContaining({
          campos_faltando: expect.arrayContaining(["nome"]),
        }),
      });
    });

    it("deve retornar erro quando email já existe como vendedor ativo", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockUsuarioExistente = {
        id: 2,
        email: "vendedor@teste.com",
        ativo: true,
        vendedores: [{ id: 1, ativo: true }],
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Usuario.findOne.mockResolvedValue(mockUsuarioExistente);

      // Act
      await VendedorController.criarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email já cadastrado como vendedor",
        errors: {
          email: "Este email já está sendo usado por um vendedor ativo",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorController.criarVendedor(req, res);

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

    it("deve retornar erro quando email tem formato inválido", async () => {
      // Arrange
      req.body = { nome: "João", email: "email-invalido" };

      // Act
      await VendedorController.criarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          email: "Formato de email inválido",
        },
      });
    });

    it("deve retornar erro quando nome é muito curto", async () => {
      // Arrange
      req.body = { nome: "A", email: "vendedor@teste.com" };

      // Act
      await VendedorController.criarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          nome: "Nome deve ter pelo menos 2 caracteres",
        },
      });
    });
  });

  describe("listarVendedores", () => {
    beforeEach(() => {
      req.user.tipo = "autopeca"; // Garantir que o tipo seja resetado
    });

    it("deve listar vendedores com sucesso", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockVendedores = [
        {
          id: 1,
          nome_completo: "João Vendedor",
          ativo: true,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          usuario: {
            id: 2,
            email: "vendedor@teste.com",
            tipo_usuario: "vendedor",
            ativo: true,
            data_criacao: new Date(),
            data_atualizacao: new Date(),
          },
        },
      ];

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Vendedor.findAll.mockResolvedValue(mockVendedores);

      // Act
      await VendedorController.listarVendedores(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendedores listados com sucesso",
        data: {
          vendedores: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              nome_completo: "João Vendedor",
              ativo: true,
            }),
          ]),
          total: 1,
        },
      });
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorController.listarVendedores(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para autopeças",
        },
      });
    });

    it("deve retornar erro quando autopeça não é encontrada", async () => {
      // Arrange
      Autopeca.findOne.mockResolvedValue(null);

      // Act
      await VendedorController.listarVendedores(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Autopeça não encontrada",
        errors: {
          autopeca: "Perfil de autopeça não encontrado para este usuário",
        },
      });
    });

    it("deve retornar lista vazia quando não há vendedores", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Vendedor.findAll.mockResolvedValue([]);

      // Act
      await VendedorController.listarVendedores(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendedores listados com sucesso",
        data: {
          vendedores: [],
          total: 0,
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorController.listarVendedores(req, res);

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

  describe("atualizarVendedor", () => {
    beforeEach(() => {
      req.params = { vendedorId: "1" };
    });

    it("deve atualizar vendedor com sucesso", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        update: jest.fn().mockResolvedValue(true),
        usuario: {
          id: 2,
          email: "vendedor@teste.com",
          tipo_usuario: "vendedor",
          ativo: true,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
      };
      const mockVendedorAtualizado = {
        id: 1,
        nome_completo: "João Vendedor Atualizado",
        ativo: true,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        usuario: mockVendedor.usuario,
      };

      req.body = { nome_completo: "João Vendedor Atualizado" };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Vendedor.findOne.mockResolvedValueOnce(mockVendedor);
      Vendedor.findOne.mockResolvedValueOnce(mockVendedorAtualizado);

      // Act
      await VendedorController.atualizarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendedor atualizado com sucesso",
        data: expect.objectContaining({
          id: 1,
          nome_completo: "João Vendedor Atualizado",
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando vendedor não pertence à autopeça", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Vendedor.findOne.mockResolvedValue(null);

      // Act
      await VendedorController.atualizarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendedor não encontrado",
        errors: {
          vendedor: "Vendedor não encontrado ou não pertence a esta autopeça",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorController.atualizarVendedor(req, res);

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

  describe("inativarVendedor", () => {
    beforeEach(() => {
      req.params = { vendedorId: "1" };
    });

    it("deve inativar vendedor com sucesso", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockUsuario = {
        id: 2,
        email: "vendedor@teste.com",
        ativo: true,
        update: jest.fn().mockResolvedValue(true),
      };
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        update: jest.fn().mockResolvedValue(true),
        usuario: mockUsuario,
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Vendedor.findOne.mockResolvedValue(mockVendedor);

      // Act
      await VendedorController.inativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendedor inativado com sucesso",
        data: expect.objectContaining({
          vendedor: expect.objectContaining({
            id: 1,
            ativo: false,
          }),
          usuario: expect.objectContaining({
            id: 2,
            ativo: false,
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando vendedor já está inativo", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockVendedor = {
        id: 1,
        ativo: false,
        usuario: { id: 2, ativo: false },
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Vendedor.findOne.mockResolvedValue(mockVendedor);

      // Act
      await VendedorController.inativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendedor já está inativo",
        errors: {
          status: "Este vendedor já está inativo",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorController.inativarVendedor(req, res);

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

  describe("reativarVendedor", () => {
    beforeEach(() => {
      req.params = { vendedorId: "1" };
    });

    it("deve reativar vendedor com sucesso", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockUsuario = {
        id: 2,
        email: "vendedor@teste.com",
        ativo: false,
        tipo_usuario: "vendedor",
      };
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: false,
        usuario: mockUsuario,
      };
      const mockUsuarioAtual = {
        id: 2,
        ativo: false,
        tipo_usuario: "vendedor",
      };

      // Mock da busca de autopeça logada (primeira chamada)
      Autopeca.findOne.mockResolvedValueOnce(mockAutopeca);
      // Mock da busca de vendedor
      Vendedor.findOne.mockResolvedValue(mockVendedor);
      // Mock da busca de usuário atual (para verificar conflitos)
      Usuario.findByPk.mockResolvedValue(mockUsuarioAtual); // Usuário inativo = sem conflito
      // Mock da busca de perfis conflitantes (não encontrados)
      Cliente.findOne.mockResolvedValue(null);
      Autopeca.findOne.mockResolvedValueOnce(null); // Para verificar conflito (não encontrada)
      // Mock das atualizações
      Vendedor.update.mockResolvedValue([1]);
      Usuario.update.mockResolvedValue([1]);

      // Act
      await VendedorController.reativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendedor reativado com sucesso",
        data: expect.objectContaining({
          vendedor: expect.objectContaining({
            id: 1,
            ativo: true,
          }),
          usuario: expect.objectContaining({
            id: 2,
            ativo: true,
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando vendedor já está ativo", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        usuario: { 
          id: 2, 
          email: "vendedor@teste.com",
          ativo: true, 
          tipo_usuario: "vendedor" 
        },
      };

      // IMPORTANTE: Resetar mocks antes de configurar para evitar interferência de outros testes
      Autopeca.findOne.mockReset();
      Vendedor.findOne.mockReset();

      // Mock da busca de autopeça logada (via validarAcessoAutopeca)
      // Esta chamada usa where: { usuario_id: userId } (userId = 1 do req.user)
      // Usar mockImplementation para garantir que retorna a autopeça quando chamado com transaction
      Autopeca.findOne.mockImplementation((options) => {
        // Se tiver transaction e where.usuario_id === req.user.userId, é a chamada de validarAcessoAutopeca
        if (options && options.transaction && options.where && options.where.usuario_id === req.user.userId) {
          return Promise.resolve(mockAutopeca);
        }
        // Qualquer outra chamada retorna null (não há verificação de conflitos quando vendedor já está ativo)
        return Promise.resolve(null);
      });
      
      // Mock da busca de vendedor
      // Vendedor.findOne sempre retorna o vendedor quando chamado
      // Usar mockImplementation para garantir que sempre retorna o vendedor
      Vendedor.findOne.mockImplementation(() => Promise.resolve(mockVendedor));

      // Act
      await VendedorController.reativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendedor já está ativo",
        errors: {
          status: "Este vendedor já está ativo",
        },
      });
    });

    it("deve retornar erro quando email já existe como cliente ativo", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockUsuario = {
        id: 2,
        email: "vendedor@teste.com",
        ativo: true, // Usuário está ativo
        tipo_usuario: "vendedor",
      };
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: false,
        usuario: mockUsuario,
      };
      const mockUsuarioAtual = {
        id: 2,
        ativo: true, // Usuário ativo no banco
        tipo_usuario: "vendedor",
      };
      const mockCliente = {
        id: 1,
        usuario_id: 2,
        usuario: {
          id: 2,
          ativo: true, // Cliente ativo
        },
      };

      // Mock da busca de autopeça logada (via validarAcessoAutopeca)
      // Esta chamada usa where: { usuario_id: userId } (userId = 1 do req.user)
      Autopeca.findOne.mockImplementation((options) => {
        if (options && options.where && options.where.usuario_id === req.user.userId) {
          return Promise.resolve(mockAutopeca);
        }
        // Segunda chamada: busca autopeca para verificar conflito (where: { usuario_id: usuarioId })
        // usuarioId = 2 (do vendedor.usuario.id)
        if (options && options.where && options.where.usuario_id === 2) {
          return Promise.resolve(null); // Não encontrada
        }
        return Promise.resolve(null);
      });
      // Mock da busca de vendedor (usa where: { id: vendedorId, autopeca_id: autopeca.id })
      Vendedor.findOne.mockResolvedValue(mockVendedor);
      // Mock da busca de usuário atual (para verificar conflitos)
      Usuario.findByPk.mockResolvedValue(mockUsuarioAtual); // Usuário ativo = verificar conflito
      // Mock da busca de perfis conflitantes (em paralelo)
      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await VendedorController.reativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Não é possível reativar o vendedor",
        errors: {
          conflito: "Este email já está cadastrado como cliente/autopeça ativo. Para reativar o vendedor, é necessário primeiro excluir a conta ativa.",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando email já existe como autopeça ativa", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockUsuario = {
        id: 2,
        email: "vendedor@teste.com",
        ativo: true, // Usuário está ativo
        tipo_usuario: "vendedor",
      };
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: false,
        usuario: mockUsuario,
      };
      const mockUsuarioAtual = {
        id: 2,
        ativo: true, // Usuário ativo no banco
        tipo_usuario: "vendedor",
      };
      const mockOutraAutopeca = {
        id: 2,
        usuario_id: 2,
        usuario: {
          id: 2,
          ativo: true, // Autopeça ativa
        },
      };

      Autopeca.findOne
        .mockResolvedValueOnce(mockAutopeca) // Primeira busca: autopeça logada
        .mockResolvedValueOnce(mockOutraAutopeca); // Segunda busca: verificar autopeca (encontrada e ativa)
      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Usuario.findByPk.mockResolvedValue(mockUsuarioAtual); // Usuário ativo = verificar conflito
      Cliente.findOne.mockResolvedValue(null);

      // Act
      await VendedorController.reativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Não é possível reativar o vendedor",
        errors: {
          conflito: "Este email já está cadastrado como cliente/autopeça ativo. Para reativar o vendedor, é necessário primeiro excluir a conta ativa.",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando autopeça não é encontrada", async () => {
      // Arrange
      Autopeca.findOne.mockResolvedValue(null);

      // Act
      await VendedorController.reativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Autopeça não encontrada",
        errors: {
          autopeca: "Perfil de autopeça não encontrado para este usuário",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorController.reativarVendedor(req, res);

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

  describe("atualizarVendedor", () => {
    beforeEach(() => {
      req.params = { vendedorId: "1" };
    });

    it("deve retornar erro quando autopeça não é encontrada", async () => {
      // Arrange
      Autopeca.findOne.mockResolvedValue(null);

      // Act
      await VendedorController.atualizarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Autopeça não encontrada",
        errors: {
          autopeca: "Perfil de autopeça não encontrado para este usuário",
        },
      });
    });

    it("deve retornar erro quando não há campos para atualizar", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        usuario: {
          id: 2,
          email: "vendedor@teste.com",
          tipo_usuario: "vendedor",
          ativo: true,
        },
      };

      req.body = {}; // Nenhum campo para atualizar

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Vendedor.findOne.mockResolvedValue(mockVendedor);

      // Act
      await VendedorController.atualizarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Não há alterações a serem salvas. Os dados fornecidos são idênticos aos atuais.",
        errors: {
          campos: "Nenhum campo válido foi modificado.",
        },
      });
    });
  });

  describe("inativarVendedor", () => {
    beforeEach(() => {
      req.params = { vendedorId: "1" };
    });

    it("deve retornar erro quando autopeça não é encontrada", async () => {
      // Arrange
      Autopeca.findOne.mockResolvedValue(null);

      // Act
      await VendedorController.inativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Autopeça não encontrada",
        errors: {
          autopeca: "Perfil de autopeça não encontrado para este usuário",
        },
      });
    });

    it("deve retornar erro quando vendedor não pertence à autopeça", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Vendedor.findOne.mockResolvedValue(null);

      // Act
      await VendedorController.inativarVendedor(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendedor não encontrado",
        errors: {
          vendedor: "Vendedor não encontrado ou não pertence a esta autopeça",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorController.inativarVendedor(req, res);

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

});

