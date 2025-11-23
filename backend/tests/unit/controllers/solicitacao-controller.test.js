const SolicitacaoController = require("../../../src/controllers/solicitacaoController");
const {
  Solicitacao,
  Cliente,
  Usuario,
  ImagemSolicitacao,
  SolicitacoesAtendimento,
} = require("../../../src/models");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Solicitacao: {
    sequelize: {
      transaction: jest.fn(),
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
    findAll: jest.fn(),
    destroy: jest.fn(),
  },
  Autopeca: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  Vendedor: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  Usuario: {
    findOne: jest.fn(),
  },
  SolicitacoesAtendimento: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  Op: {
    and: Symbol("Op.and"),
    iLike: Symbol("Op.iLike"),
    ne: Symbol("Op.ne"),
    or: Symbol("Op.or"),
  },
}));

// Mock do sequelize Op
jest.mock("sequelize", () => ({
  Op: {
    and: Symbol("Op.and"),
    iLike: Symbol("Op.iLike"),
    ne: Symbol("Op.ne"),
    or: Symbol("Op.or"),
  },
}));

// Mock do emailService
jest.mock("../../../src/services", () => ({
  emailService: {
    sendNewRequestNotification: jest.fn().mockResolvedValue({}),
  },
}));

// Mock do NotificationService
jest.mock("../../../src/services/notificationService", () => ({
  notificarClienteSolicitacaoCancelada: jest.fn(),
  notificarAutopecasSolicitacaoCancelada: jest.fn(),
}));

// Mock do path
jest.mock("path", () => ({
  extname: jest.fn((filename) => {
    const match = filename.match(/\.(\w+)$/);
    return match ? `.${match[1]}` : "";
  }),
  join: jest.fn((...args) => args.join("/")),
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
      files: [],
      apiVeicularInfo: null,
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

    // Reconfigurar mock de transaction após clearAllMocks
    if (Solicitacao.sequelize) {
      Solicitacao.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
    }
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
      const mockUsuario = {
        id: 1,
        email: "cliente@teste.com",
        tipo_usuario: "cliente",
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
        usuario: mockUsuario,
      };

      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        ano_modelo: 2021,
        categoria: "carro",
        cor: "Branco",
        origem_dados_veiculo: "manual",
        status_cliente: "ativa",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
        created_at: new Date(),
        trim: jest.fn().mockReturnThis(),
        toUpperCase: jest.fn().mockReturnThis(),
      };

      const { Autopeca, Vendedor, Op } = require("../../../src/models");

      // Mock Cliente.findOne com include
      Cliente.findOne.mockImplementation((options) => {
        if (options && options.include) {
          // Simular include do Usuario
          return Promise.resolve({
            ...mockCliente,
            usuario: mockUsuario,
          });
        }
        return Promise.resolve(mockCliente);
      });

      Solicitacao.create.mockResolvedValue(mockSolicitacao);
      Autopeca.findAll.mockResolvedValue([]); // Nenhuma autopeça para notificar
      Vendedor.findAll.mockResolvedValue([]); // Nenhum vendedor para notificar

      // Mock do Op para as queries
      Op.and = jest.fn();
      Op.iLike = jest.fn();
      Op.ne = jest.fn();

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
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

    it("deve retornar erro quando ano_fabricacao não é um número válido", async () => {
      // Arrange
      req.body = {
        descricao_peca: "Freio dianteiro",
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: "não é número",
        ano_modelo: "2021",
        categoria: "carro",
        cor: "Branco",
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
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
          ano_fabricacao: "Ano de fabricação deve ser um número válido",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando ano_modelo não é um número válido", async () => {
      // Arrange
      req.body = {
        descricao_peca: "Freio dianteiro",
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: "2020",
        ano_modelo: "não é número",
        categoria: "carro",
        cor: "Branco",
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
      };

      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Ano do modelo inválido",
        errors: {
          ano_modelo: "Ano do modelo deve ser um número válido",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando UF final tem formato inválido", async () => {
      // Arrange
      req.body = {
        descricao_peca: "Freio dianteiro",
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: "2020",
        ano_modelo: "2021",
        categoria: "carro",
        cor: "Branco",
        uf_atendimento: "SPP", // UF inválida
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SPP", // UF inválida no perfil também
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
      };

      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "UF deve ter 2 caracteres",
        errors: {
          uf_atendimento: "UF deve ter exatamente 2 caracteres",
          uf_final: "SPP",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando ano_fabricacao não é um número válido", async () => {
      // Arrange
      req.body = {
        ...validSolicitacaoData,
        ano_fabricacao: "não é número",
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
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
          ano_fabricacao: "Ano de fabricação deve ser um número válido",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando ano_modelo não é um número válido", async () => {
      // Arrange
      req.body = {
        ...validSolicitacaoData,
        ano_modelo: "não é número",
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
      };

      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Ano do modelo inválido",
        errors: {
          ano_modelo: "Ano do modelo deve ser um número válido",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando UF final tem formato inválido", async () => {
      // Arrange
      req.body = {
        ...validSolicitacaoData,
        uf_atendimento: "SPP", // UF inválida
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SPP", // UF inválida no perfil também
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
      };

      Cliente.findOne.mockResolvedValue(mockCliente);

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "UF deve ter 2 caracteres",
        errors: {
          uf_atendimento: "UF deve ter exatamente 2 caracteres",
          uf_final: "SPP",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve criar solicitação com chassi e renavam informados", async () => {
      // Arrange
      req.body = {
        ...validSolicitacaoData,
        chassi: "9BW12345678901234",
        renavam: "12345678901",
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
      };

      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        chassi: "9BW12345678901234",
        renavam: "12345678901",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
        created_at: new Date(),
      };

      // Mock Cliente.findOne com include
      Cliente.findOne.mockImplementation((options) => {
        if (options && options.include) {
          return Promise.resolve({
            ...mockCliente,
            usuario: mockCliente.usuario,
          });
        }
        return Promise.resolve(mockCliente);
      });

      Solicitacao.create.mockResolvedValue(mockSolicitacao);
      const { Autopeca, Vendedor, Op } = require("../../../src/models");
      
      // Mock Autopeca.findAll para retornar array vazio (sem autopeças para notificar)
      Autopeca.findAll.mockResolvedValue([]);
      
      // Mock Vendedor.findAll para retornar array vazio (sem vendedores para notificar)
      Vendedor.findAll.mockResolvedValue([]);

      // Mock do emailService para evitar erros
      const { emailService } = require("../../../src/services");
      emailService.sendNewRequestNotification.mockResolvedValue({});

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(Solicitacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          chassi: "9BW12345678901234",
          renavam: "12345678901",
        }),
        { transaction: mockTransaction }
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("deve criar solicitação com chassi e renavam como 'Não informado' quando não fornecidos", async () => {
      // Arrange
      req.body = {
        ...validSolicitacaoData,
        chassi: "",
        renavam: "",
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
      };

      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        chassi: "Não informado",
        renavam: "Não informado",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
        created_at: new Date(),
      };

      // Mock Cliente.findOne com include
      Cliente.findOne.mockImplementation((options) => {
        if (options && options.include) {
          return Promise.resolve({
            ...mockCliente,
            usuario: mockCliente.usuario,
          });
        }
        return Promise.resolve(mockCliente);
      });

      Solicitacao.create.mockResolvedValue(mockSolicitacao);
      const { Autopeca, Vendedor } = require("../../../src/models");
      
      // Mock Autopeca.findAll para retornar array vazio (sem autopeças para notificar)
      Autopeca.findAll.mockResolvedValue([]);
      
      // Mock Vendedor.findAll para retornar array vazio (sem vendedores para notificar)
      Vendedor.findAll.mockResolvedValue([]);

      // Mock do emailService para evitar erros
      const { emailService } = require("../../../src/services");
      emailService.sendNewRequestNotification.mockResolvedValue({});

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(Solicitacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          chassi: "Não informado",
          renavam: "Não informado",
        }),
        { transaction: mockTransaction }
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("deve criar solicitação com origem_dados_veiculo e api_veicular_metadata", async () => {
      // Arrange
      req.body = {
        ...validSolicitacaoData,
        origem_dados_veiculo: "api",
        api_veicular_metadata: { consultado: true, timestamp: new Date() },
      };
      req.apiVeicularInfo = {
        consultado: true,
        origem: "api",
        motivo: "sucesso",
        timestamp: new Date().toISOString(),
      };

      const mockCliente = {
        id: 1,
        usuario_id: 1,
        cidade: "São Paulo",
        uf: "SP",
        usuario: { id: 1, email: "test@test.com", tipo_usuario: "cliente" },
      };

      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        origem_dados_veiculo: "api",
        api_veicular_metadata: { consultado: true },
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
        created_at: new Date(),
      };

      // Mock Cliente.findOne com include
      Cliente.findOne.mockImplementation((options) => {
        if (options && options.include) {
          return Promise.resolve({
            ...mockCliente,
            usuario: mockCliente.usuario,
          });
        }
        return Promise.resolve(mockCliente);
      });

      Solicitacao.create.mockResolvedValue(mockSolicitacao);
      const { Autopeca, Vendedor } = require("../../../src/models");
      
      // Mock Autopeca.findAll para retornar array vazio (sem autopeças para notificar)
      Autopeca.findAll.mockResolvedValue([]);
      
      // Mock Vendedor.findAll para retornar array vazio (sem vendedores para notificar)
      Vendedor.findAll.mockResolvedValue([]);

      // Mock do emailService para evitar erros
      const { emailService } = require("../../../src/services");
      emailService.sendNewRequestNotification.mockResolvedValue({});

      // Act
      await SolicitacaoController.create(req, res);

      // Assert
      expect(Solicitacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          origem_dados_veiculo: "api",
          api_veicular_metadata: expect.objectContaining({
            consultado: true,
          }),
        }),
        { transaction: mockTransaction }
      );
      expect(res.status).toHaveBeenCalledWith(201);
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

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Cliente.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await SolicitacaoController.list(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          server: "Erro ao processar solicitação",
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
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          descricao_peca: "Freio dianteiro",
          status_cliente: "ativa",
          imagens: [],
        }),
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
          solicitacao: expect.objectContaining({
            id: 1,
            cliente_id: 1,
            descricao_peca: "Freio dianteiro",
            status_cliente: "ativa",
            imagens: [],
          }),
        },
      });
    });

    it("deve buscar solicitação quando usuário é autopeca", async () => {
      // Arrange
      req.user.tipo = "autopeca";
      req.params = { id: "1" };
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
        imagens: [],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          status_cliente: "ativa",
          imagens: [],
        }),
      };

      const { Autopeca } = require("../../../src/models");
      Autopeca.findOne = jest.fn().mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findOne.mockResolvedValue(null); // Não tem atendimento
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.getById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação encontrada com sucesso",
        data: {
          solicitacao: expect.any(Object),
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
        update: jest.fn().mockResolvedValue(true),
      };

      const mockSolicitacaoAtualizada = {
        id: 1,
        cliente_id: 1,
        descricao_peca: "Freio traseiro atualizado",
        status_cliente: "ativa",
        imagens: [],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          descricao_peca: "Freio traseiro atualizado",
          status_cliente: "ativa",
          imagens: [],
        }),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      Solicitacao.findByPk.mockResolvedValue(mockSolicitacaoAtualizada);

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

    it("deve permitir atualizar apenas status quando solicitação não está ativa", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { status_cliente: "concluida" }; // Apenas status - mantendo o mesmo status (concluida)
      req.files = undefined; // Garantir que req.files não existe (undefined é falsy)
      req.uploadedFiles = undefined; // Também remover uploadedFiles

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "concluida", // Status atual: concluida (não ativa)
        update: jest.fn().mockResolvedValue(true),
        imagens: [],
      };

      const mockSolicitacaoAtualizada = {
        id: 1,
        cliente_id: 1,
        status_cliente: "concluida",
        imagens: [],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          status_cliente: "concluida",
          imagens: [],
        }),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      Solicitacao.findByPk.mockResolvedValue(mockSolicitacaoAtualizada);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      req.params = { id: "1" };
      Cliente.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando descricao_peca está vazia", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { descricao_peca: "" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Descrição da peça é obrigatória",
        errors: {
          descricao_peca: "Descrição não pode estar vazia",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando cidade_atendimento está vazia", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { cidade_atendimento: "" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cidade de atendimento é obrigatória",
        errors: {
          cidade_atendimento: "Cidade não pode estar vazia",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando UF tem formato inválido", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { uf_atendimento: "SPP" }; // UF com 3 caracteres

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "UF deve ter 2 caracteres",
        errors: {
          uf_atendimento: "UF deve ter exatamente 2 caracteres",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando placa tem formato inválido", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { placa: "INVALID" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Formato de placa inválido",
        errors: {
          placa: "Placa deve estar no formato Mercosul (ABC1D23) ou antigo (ABC-1234)",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando marca está vazia", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { marca: "" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Marca é obrigatória",
        errors: {
          marca: "Marca não pode estar vazia",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando modelo está vazio", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { modelo: "" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Modelo é obrigatório",
        errors: {
          modelo: "Modelo não pode estar vazio",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando ano_modelo é inválido", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { ano_modelo: 1800 }; // Ano muito antigo

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Ano do modelo inválido",
        errors: {
          ano_modelo: expect.stringContaining("Ano deve estar entre 1900 e"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando categoria é inválida", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { categoria: "invalid" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Categoria inválida",
        errors: {
          categoria: expect.stringContaining("Categoria deve ser uma das seguintes"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando cor está vazia", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { cor: "" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cor é obrigatória",
        errors: {
          cor: "Cor não pode estar vazia",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando status_cliente é inválido", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { status_cliente: "invalid_status" };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Status inválido",
        errors: {
          status_cliente: expect.stringContaining("Status deve ser um dos seguintes"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando tenta mudar de cancelada para concluida", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { status_cliente: "concluida" };
      req.files = undefined;

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "cancelada",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Não é possível marcar uma solicitação cancelada como concluída",
        errors: {
          status_cliente: "Solicitações canceladas não podem ser concluídas",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando tenta mudar de concluida para cancelada", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { status_cliente: "cancelada" };
      req.files = undefined;

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "concluida",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Não é possível cancelar uma solicitação já concluída",
        errors: {
          status_cliente: "Solicitações concluídas não podem ser canceladas",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve processar exclusão de imagens com sucesso", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { imagens_para_deletar: [1, 2] };
      req.files = undefined;

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        update: jest.fn().mockResolvedValue(true),
        imagens: [],
      };

      const mockImagensExistentes = [
        { id: 1, nome_arquivo_fisico: "img1.jpg" },
        { id: 2, nome_arquivo_fisico: "img2.jpg" },
      ];

      const mockSolicitacaoAtualizada = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        imagens: [],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          status_cliente: "ativa",
          imagens: [],
        }),
      };

      const fs = require("fs");
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      jest.spyOn(fs, "unlinkSync").mockImplementation(() => {});

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.findAll.mockResolvedValue(mockImagensExistentes);
      ImagemSolicitacao.destroy.mockResolvedValue(2);
      ImagemSolicitacao.count.mockResolvedValue(0);
      Solicitacao.findByPk.mockResolvedValue(mockSolicitacaoAtualizada);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(ImagemSolicitacao.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: [1, 2],
            solicitacao_id: 1,
          },
          transaction: expect.any(Object),
        })
      );
      expect(ImagemSolicitacao.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando imagens_para_deletar contém IDs inválidos", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { imagens_para_deletar: [1, 2, 999] }; // 999 não existe

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      const mockImagensExistentes = [
        { id: 1, nome_arquivo_fisico: "img1.jpg" },
        { id: 2, nome_arquivo_fisico: "img2.jpg" },
      ]; // Apenas 2 imagens encontradas, mas foram solicitadas 3

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.findAll.mockResolvedValue(mockImagensExistentes);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Algumas imagens não foram encontradas ou não pertencem a esta solicitação",
        errors: {
          imagens: "Imagens inválidas para exclusão",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando limite de imagens é excedido ao adicionar novas", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = {};
      req.files = [
        { originalname: "img1.jpg", filename: "img1.jpg", path: "/path/img1.jpg", size: 1000, mimetype: "image/jpeg" },
        { originalname: "img2.jpg", filename: "img2.jpg", path: "/path/img2.jpg", size: 1000, mimetype: "image/jpeg" },
        { originalname: "img3.jpg", filename: "img3.jpg", path: "/path/img3.jpg", size: 1000, mimetype: "image/jpeg" },
        { originalname: "img4.jpg", filename: "img4.jpg", path: "/path/img4.jpg", size: 1000, mimetype: "image/jpeg" },
      ];
      req.uploadedFiles = req.files; // 4 imagens, mas limite é 3

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        imagens: [],
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(0); // 0 imagens existentes, então só pode adicionar 3

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Limite de 3 imagens excedido. Você pode adicionar apenas 3 imagem(ns) mais",
        errors: {
          imagens: "Máximo de 3 imagens permitidas. Você tentou adicionar 4 mas só há 3 slot(s) disponível(is)",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve processar imagens_para_deletar como string JSON", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { imagens_para_deletar: "[1, 2]" }; // String JSON
      req.files = undefined;

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        update: jest.fn().mockResolvedValue(true),
        imagens: [],
      };

      const mockImagensExistentes = [
        { id: 1, nome_arquivo_fisico: "img1.jpg" },
        { id: 2, nome_arquivo_fisico: "img2.jpg" },
      ];

      const mockSolicitacaoAtualizada = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        imagens: [],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          status_cliente: "ativa",
          imagens: [],
        }),
      };

      const fs = require("fs");
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      jest.spyOn(fs, "unlinkSync").mockImplementation(() => {});

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.findAll.mockResolvedValue(mockImagensExistentes);
      ImagemSolicitacao.destroy.mockResolvedValue(2);
      ImagemSolicitacao.count.mockResolvedValue(0);
      Solicitacao.findByPk.mockResolvedValue(mockSolicitacaoAtualizada);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(ImagemSolicitacao.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: [1, 2],
            solicitacao_id: 1,
          },
          transaction: expect.any(Object),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve atualizar data_conclusao quando status muda para concluida", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = { status_cliente: "concluida" };
      req.files = undefined;

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        update: jest.fn().mockResolvedValue(true),
        imagens: [],
      };

      const mockSolicitacaoAtualizada = {
        id: 1,
        cliente_id: 1,
        status_cliente: "concluida",
        data_conclusao: new Date(),
        imagens: [],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          status_cliente: "concluida",
          data_conclusao: expect.any(Date),
          imagens: [],
        }),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(0);
      Solicitacao.findByPk.mockResolvedValue(mockSolicitacaoAtualizada);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(mockSolicitacao.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status_cliente: "concluida",
          data_conclusao: expect.any(Date),
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando ano_fabricacao é muito futuro", async () => {
      // Arrange
      req.params = { id: "1" };
      const anoFuturo = new Date().getFullYear() + 2; // Mais de 1 ano no futuro
      req.body = { ano_fabricacao: anoFuturo };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Ano de fabricação inválido",
        errors: {
          ano_fabricacao: expect.stringContaining("Ano deve estar entre 1900 e"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando ano_modelo é muito futuro", async () => {
      // Arrange
      req.params = { id: "1" };
      const anoFuturo = new Date().getFullYear() + 2; // Mais de 1 ano no futuro
      req.body = { ano_modelo: anoFuturo };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Ano do modelo inválido",
        errors: {
          ano_modelo: expect.stringContaining("Ano deve estar entre 1900 e"),
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve atualizar chassi e renavam corretamente", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = {
        chassi: "9BW12345678901234",
        renavam: "12345678901",
      };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        update: jest.fn().mockResolvedValue(true),
        imagens: [],
      };

      const mockSolicitacaoAtualizada = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        chassi: "9BW12345678901234",
        renavam: "12345678901",
        imagens: [],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          status_cliente: "ativa",
          chassi: "9BW12345678901234",
          renavam: "12345678901",
          imagens: [],
        }),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(0);
      Solicitacao.findByPk.mockResolvedValue(mockSolicitacaoAtualizada);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(mockSolicitacao.update).toHaveBeenCalledWith(
        expect.objectContaining({
          chassi: "9BW12345678901234",
          renavam: "12345678901",
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve definir chassi e renavam como 'Não informado' quando vazios", async () => {
      // Arrange
      req.params = { id: "1" };
      req.body = {
        chassi: "",
        renavam: "",
      };

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        update: jest.fn().mockResolvedValue(true),
        imagens: [],
      };

      const mockSolicitacaoAtualizada = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        chassi: "Não informado",
        renavam: "Não informado",
        imagens: [],
        toJSON: jest.fn().mockReturnValue({
          id: 1,
          cliente_id: 1,
          status_cliente: "ativa",
          chassi: "Não informado",
          renavam: "Não informado",
          imagens: [],
        }),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(0);
      Solicitacao.findByPk.mockResolvedValue(mockSolicitacaoAtualizada);

      // Act
      await SolicitacaoController.update(req, res);

      // Assert
      expect(mockSolicitacao.update).toHaveBeenCalledWith(
        expect.objectContaining({
          chassi: "Não informado",
          renavam: "Não informado",
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    beforeEach(() => {
      req.params = { id: "1" };
    });

    it("deve cancelar solicitação com sucesso", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        descricao_peca: "Freio dianteiro",
        marca: "Volkswagen",
        modelo: "Golf",
        update: jest.fn().mockImplementation(async (data, options) => {
          // Atualizar o objeto mock com os dados fornecidos
          Object.assign(mockSolicitacao, data);
          return mockSolicitacao;
        }),
      };
      const mockAtendimentos = [];

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findAll.mockResolvedValue(mockAtendimentos);

      // Mock do NotificationService
      const NotificationService = require("../../../src/services/notificationService");
      jest
        .spyOn(NotificationService, "notificarClienteSolicitacaoCancelada")
        .mockResolvedValue({});

      // Act
      await SolicitacaoController.cancel(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação cancelada com sucesso",
        data: expect.objectContaining({
          solicitacao: expect.objectContaining({
            id: 1,
            status_cliente: "cancelada",
          }),
          atendimentos_afetados: 0,
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve cancelar solicitação e notificar autopeças que atenderam", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        descricao_peca: "Freio dianteiro",
        marca: "Volkswagen",
        modelo: "Golf",
        update: jest.fn().mockImplementation(async (data, options) => {
          // Atualizar o objeto mock com os dados fornecidos
          Object.assign(mockSolicitacao, data);
          return mockSolicitacao;
        }),
      };
      const mockAtendimentos = [
        { id: 1, autopeca_id: 1 },
        { id: 2, autopeca_id: 2 },
      ];

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findAll.mockResolvedValue(mockAtendimentos);

      // Mock do NotificationService
      const NotificationService = require("../../../src/services/notificationService");
      jest
        .spyOn(NotificationService, "notificarClienteSolicitacaoCancelada")
        .mockResolvedValue({});
      jest
        .spyOn(NotificationService, "notificarAutopecasSolicitacaoCancelada")
        .mockResolvedValue([]);

      // Act
      await SolicitacaoController.cancel(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação cancelada com sucesso",
        data: expect.objectContaining({
          atendimentos_afetados: 2,
        }),
      });
      expect(
        NotificationService.notificarAutopecasSolicitacaoCancelada
      ).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é cliente", async () => {
      // Arrange
      req.user.tipo = "autopeca";

      // Act
      await SolicitacaoController.cancel(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Apenas clientes podem cancelar solicitações",
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
      await SolicitacaoController.cancel(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cliente não encontrado",
        errors: {
          cliente: "Usuário autenticado não possui perfil de cliente",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando solicitação não é encontrada", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(null);

      // Act
      await SolicitacaoController.cancel(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não encontrada",
        errors: {
          solicitacao: "Solicitação não existe ou não pertence ao usuário",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando solicitação não pode ser cancelada", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "concluida", // Status que não permite cancelamento
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.cancel(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não pode ser cancelada",
        errors: {
          status: "Apenas solicitações ativas podem ser canceladas",
          status_atual: "concluida",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve remover ':' do início do ID se existir", async () => {
      // Arrange
      req.params = { id: ":1" };
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
        descricao_peca: "Freio dianteiro",
        marca: "Volkswagen",
        modelo: "Golf",
        update: jest.fn().mockResolvedValue(true),
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findAll.mockResolvedValue([]);

      const NotificationService = require("../../../src/services/notificationService");
      jest
        .spyOn(NotificationService, "notificarClienteSolicitacaoCancelada")
        .mockResolvedValue({});

      // Act
      await SolicitacaoController.cancel(req, res);

      // Assert
      expect(Solicitacao.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "1", // ID sem o ":"
            cliente_id: 1,
          }),
          transaction: expect.any(Object),
        })
      );
    });
  });

  describe("adicionarImagens", () => {
    beforeEach(() => {
      req.params = { id: "1" };
      req.uploadedFiles = [];
    });

    it("deve adicionar imagens com sucesso", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };
      const mockImagens = [
        {
          id: 1,
          nome_arquivo: "imagem1.jpg",
          nome_arquivo_fisico: "imagem1_123.jpg",
          caminho_arquivo: "/uploads/imagem1_123.jpg",
        },
      ];

      req.uploadedFiles = [
        {
          originalname: "imagem1.jpg",
          filename: "imagem1_123.jpg",
          path: "/uploads/imagem1_123.jpg",
          size: 1024,
          mimetype: "image/jpeg",
        },
      ];

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(0);
      ImagemSolicitacao.create.mockResolvedValue(mockImagens[0]);

      // Mock do path.extname
      const path = require("path");
      jest.spyOn(path, "extname").mockReturnValue(".jpg");

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "1 imagem(ns) adicionada(s) com sucesso",
        data: expect.objectContaining({
          solicitacao_id: "1",
          imagens: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              nome_arquivo: "imagem1.jpg",
            }),
          ]),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é cliente", async () => {
      // Arrange
      req.user.tipo = "autopeca";

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Apenas clientes podem adicionar imagens às solicitações",
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando cliente não é encontrado", async () => {
      // Arrange
      Cliente.findOne.mockResolvedValue(null);

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Cliente não encontrado",
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando solicitação não é encontrada", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(null);

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não encontrada",
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando solicitação não pode receber imagens", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "concluida", // Status que não permite adicionar imagens
      };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Não é possível adicionar imagens a esta solicitação",
        errors: {
          status: "Apenas solicitações ativas podem receber imagens",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando nenhuma imagem foi enviada", async () => {
      // Arrange
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      req.uploadedFiles = []; // Nenhuma imagem

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Nenhuma imagem foi enviada",
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve remover ':' do início do ID se existir", async () => {
      // Arrange
      req.params = { id: ":1" };
      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      req.uploadedFiles = [
        {
          originalname: "imagem1.jpg",
          filename: "imagem1_123.jpg",
          path: "/uploads/imagem1_123.jpg",
          size: 1024,
          mimetype: "image/jpeg",
        },
      ];

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(0);
      ImagemSolicitacao.create.mockResolvedValue({
        id: 1,
        nome_arquivo: "imagem1.jpg",
        nome_arquivo_fisico: "imagem1_123.jpg",
      });

      // Mock do path.extname
      const path = require("path");
      jest.spyOn(path, "extname").mockReturnValue(".jpg");

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(Solicitacao.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "1", // ID sem o ":"
            cliente_id: 1,
          }),
          transaction: expect.any(Object),
        })
      );
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      req.params = { id: "1" };
      req.files = [
        {
          filename: "imagem1.jpg",
          path: "/uploads/imagem1.jpg",
        },
      ];

      Cliente.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve adicionar múltiplas imagens com ordem correta", async () => {
      // Arrange
      req.params = { id: "1" };
      req.files = [
        { originalname: "img1.jpg", filename: "img1.jpg", path: "/path/img1.jpg", size: 1000, mimetype: "image/jpeg" },
        { originalname: "img2.jpg", filename: "img2.jpg", path: "/path/img2.jpg", size: 1000, mimetype: "image/jpeg" },
      ];
      req.uploadedFiles = req.files;

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      const mockImagens = [
        { id: 1, nome_arquivo: "img1.jpg", nome_arquivo_fisico: "img1.jpg" },
        { id: 2, nome_arquivo: "img2.jpg", nome_arquivo_fisico: "img2.jpg" },
      ];

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(0);
      ImagemSolicitacao.create
        .mockResolvedValueOnce(mockImagens[0])
        .mockResolvedValueOnce(mockImagens[1]);

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(ImagemSolicitacao.create).toHaveBeenCalledTimes(2);
      expect(ImagemSolicitacao.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          ordem_exibicao: 1,
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(ImagemSolicitacao.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          ordem_exibicao: 2,
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "2 imagem(ns) adicionada(s) com sucesso",
        })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve adicionar imagens com ordem correta considerando imagens existentes", async () => {
      // Arrange
      req.params = { id: "1" };
      req.files = [
        { originalname: "img3.jpg", filename: "img3.jpg", path: "/path/img3.jpg", size: 1000, mimetype: "image/jpeg" },
      ];
      req.uploadedFiles = req.files;

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      const mockImagem = { id: 3, nome_arquivo: "img3.jpg", nome_arquivo_fisico: "img3.jpg" };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(2); // Já existem 2 imagens
      ImagemSolicitacao.create.mockResolvedValue(mockImagem);

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(ImagemSolicitacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ordem_exibicao: 3, // Deve ser 3 (2 existentes + 1 nova)
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve processar arquivos com originalName e fileName alternativos", async () => {
      // Arrange
      req.params = { id: "1" };
      req.files = [
        { originalName: "img1.jpg", fileName: "img1.jpg", path: "/path/img1.jpg", size: 1000, mimetype: "image/jpeg" },
      ];
      req.uploadedFiles = req.files;

      const mockCliente = { id: 1, usuario_id: 1 };
      const mockSolicitacao = {
        id: 1,
        cliente_id: 1,
        status_cliente: "ativa",
      };

      const mockImagem = { id: 1, nome_arquivo: "img1.jpg", nome_arquivo_fisico: "img1.jpg" };

      Cliente.findOne.mockResolvedValue(mockCliente);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      ImagemSolicitacao.count.mockResolvedValue(0);
      ImagemSolicitacao.create.mockResolvedValue(mockImagem);

      // Act
      await SolicitacaoController.adicionarImagens(req, res);

      // Assert
      expect(ImagemSolicitacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome_arquivo: "img1.jpg",
          nome_arquivo_fisico: "img1.jpg",
        }),
        expect.objectContaining({ transaction: expect.any(Object) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });
});
