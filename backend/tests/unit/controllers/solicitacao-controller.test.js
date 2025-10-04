const SolicitacaoController = require("../../../src/controllers/solicitacaoController");
const {
  Solicitacao,
  Cliente,
  Usuario,
  ImagemSolicitacao,
} = require("../../../src/models");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Solicitacao: {
    sequelize: {
      transaction: jest.fn(() => ({
        commit: jest.fn(),
        rollback: jest.fn(),
      })),
    },
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  Cliente: {
    findOne: jest.fn(),
  },
  Usuario: {
    findOne: jest.fn(),
  },
  ImagemSolicitacao: {
    create: jest.fn(),
    count: jest.fn(),
  },
}));

describe("SolicitacaoController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    req = {
      user: {
        userId: 1,
        tipo: "cliente",
      },
      body: {},
      uploadedFiles: [],
    };

    // Mock response
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock transaction
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    Solicitacao.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe("create", () => {
    const validSolicitacaoData = {
      descricao_peca: "Freio dianteiro",
      cidade_atendimento: "São Paulo",
      uf_atendimento: "SP",
      placa: "ABC1234",
      marca: "Volkswagen",
      modelo: "Golf",
      ano_fabricacao: 2020,
      ano_modelo: 2021,
      categoria: "carro",
      cor: "Branco",
      chassi: "123456789",
      renavam: "987654321",
      origem_dados_veiculo: "manual",
    };

    beforeEach(() => {
      req.body = validSolicitacaoData;
    });

    it("deve criar uma solicitação com sucesso", async () => {
      // Arrange
      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
      };

      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
        created_at: new Date(),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.create.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação criada com 0 imagem(ns)",
        data: expect.objectContaining({
          solicitacao: expect.objectContaining({
            id: 1,
            placa: "ABC1234",
            marca: "Volkswagen",
            modelo: "Golf",
          }),
          imagens: [],
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é cliente", async () => {
      // Arrange
      req.user.tipo = "autopeca";

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Apenas clientes podem criar solicitações",
        errors: {
          authorization: "Usuário deve ser do tipo 'cliente'",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando cliente não é encontrado", async () => {
      // Arrange
      Cliente.findOne.mockResolvedValue(null);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cliente não encontrado",
        errors: {
          cliente: "Perfil de cliente não encontrado",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando campos obrigatórios estão faltando", async () => {
      // Arrange
      req.body = { descricao_peca: "Freio dianteiro" }; // Campos faltando
      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
      };
      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Campos obrigatórios não fornecidos",
        errors: expect.objectContaining({
          campos_faltando: expect.arrayContaining([
            "placa",
            "marca",
            "modelo",
            "ano_fabricacao",
            "ano_modelo",
            "categoria",
            "cor",
          ]),
        }),
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro para ano de fabricação inválido", async () => {
      // Arrange
      req.body = { ...validSolicitacaoData, ano_fabricacao: 1800 }; // Ano inválido
      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
      };
      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Ano de fabricação inválido",
        errors: {
          ano_fabricacao: expect.stringContaining(
            "Ano deve estar entre 1900 e"
          ),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro para categoria inválida", async () => {
      // Arrange
      req.body = { ...validSolicitacaoData, categoria: "categoria_invalida" };
      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
      };
      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Categoria inválida",
        errors: {
          categoria: expect.stringContaining(
            "Categoria deve ser uma das seguintes"
          ),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve usar cidade/UF do perfil do cliente quando não informados", async () => {
      // Arrange
      req.body = { ...validSolicitacaoData };
      delete req.body.cidade_atendimento;
      delete req.body.uf_atendimento;

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "Rio de Janeiro",
        uf: "RJ",
      };

      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        cidade_atendimento: "Rio de Janeiro",
        uf_atendimento: "RJ",
        created_at: new Date(),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.create.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(Solicitacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cidade_atendimento: "Rio de Janeiro",
          uf_atendimento: "RJ",
        }),
        { transaction: mockTransaction }
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("list", () => {
    it("deve listar solicitações do cliente com sucesso", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacoes = [
        { id: 1, descricao_peca: "Freio", status_cliente: "ativa" },
        { id: 2, descricao_peca: "Pneu", status_cliente: "concluida" },
      ];

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findAll.mockResolvedValue(mockSolicitacoes);

      // Act
      await SolicitacaoController.list(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações listadas com sucesso",
        data: {
          solicitacoes: mockSolicitacoes,
          total: 2,
        },
      });
    });

    it("deve retornar erro quando usuário não é cliente", async () => {
      // Arrange
      req.user.tipo = "autopeca";

      // Act
      await SolicitacaoController.list(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Apenas clientes podem visualizar suas solicitações",
        errors: {
          authorization: "Usuário deve ser do tipo 'cliente'",
        },
      });
    });

    it("deve retornar erro quando cliente não é encontrado", async () => {
      // Arrange
      Cliente.findOne.mockResolvedValue(null);

      // Act
      await SolicitacaoController.list(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cliente não encontrado",
        errors: {
          cliente: "Usuário autenticado não possui perfil de cliente",
        },
      });
    });
  });

  describe("getById", () => {
    it("deve buscar solicitação específica com sucesso", async () => {
      // Arrange
      req.params = { id: "1" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        descricao_peca: "Freio dianteiro",
        status_cliente: "ativa",
        imagens: [],
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.getById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação encontrada com sucesso",
        data: {
          solicitacao: mockSolicitacao,
        },
      });
    });

    it("deve retornar erro quando solicitação não é encontrada", async () => {
      // Arrange
      req.params = { id: "999" };

      const mockCliente = { id: 1, usuario_id: 1 };
      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(null);

      // Act
      await SolicitacaoController.getById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não encontrada",
        errors: {
          solicitacao: "Solicitação não existe ou não pertence ao usuário",
        },
      });
    });
  });

  describe("update", () => {
    it("deve atualizar solicitação com sucesso", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { descricao_peca: "Freio traseiro atualizado" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        update: jest.fn(),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      Solicitacao.findByPk.mockResolvedValue({
        ...mockSolicitacao,
        descricao_peca: "Freio traseiro atualizado",
      });

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação atualizada com sucesso",
        data: {
          solicitacao: expect.objectContaining({
            descricao_peca: "Freio traseiro atualizado",
          }),
        },
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando solicitação não pode ser editada", async () => {
      // Arrange
      req.params = { id: "1" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "concluida", // Status que não permite edição
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não pode ser editada",
        errors: {
          status: "Apenas solicitações ativas podem ser editadas",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});
