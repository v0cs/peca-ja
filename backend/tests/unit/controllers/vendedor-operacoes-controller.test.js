const VendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
const {
  Vendedor,
  Usuario,
  Autopeca,
  Solicitacao,
  Cliente,
  SolicitacoesAtendimento,
  ImagemSolicitacao,
} = require("../../../src/models");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Vendedor: {
    findOne: jest.fn(),
    sequelize: {
      transaction: jest.fn(),
    },
  },
  Usuario: {
    findOne: jest.fn(),
  },
  Autopeca: {
    findOne: jest.fn(),
  },
  Solicitacao: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  Cliente: {
    findOne: jest.fn(),
  },
  SolicitacoesAtendimento: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    destroy: jest.fn(),
  },
  ImagemSolicitacao: {
    findOne: jest.fn(),
  },
}));

// Mock do NotificationService
jest.mock("../../../src/services/notificationService", () => ({
  notificarClienteSolicitacaoAtendida: jest.fn(),
  notificarAutopecaVendedorAtendeu: jest.fn(),
  notificarOutrosVendedoresPerderam: jest.fn(),
}));

describe("VendedorOperacoesController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});

    req = {
      user: {
        userId: 1,
        tipo: "vendedor",
      },
      body: {},
      params: {},
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
    if (Vendedor.sequelize) {
      Vendedor.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getProfile", () => {
    it("deve buscar perfil do vendedor com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        data_criacao: new Date("2024-01-01"),
        data_atualizacao: new Date("2024-01-02"),
        usuario: {
          id: 1,
          email: "vendedor@teste.com",
          tipo_usuario: "vendedor",
          ativo: true,
          data_criacao: new Date("2024-01-01"),
          data_atualizacao: new Date("2024-01-02"),
        },
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);

      // Act
      await VendedorOperacoesController.getProfile(req, res);

      // Assert
      expect(Vendedor.findOne).toHaveBeenCalledWith({
        where: { usuario_id: 1 },
        include: expect.arrayContaining([
          expect.objectContaining({
            model: Usuario,
            as: "usuario",
          }),
          expect.objectContaining({
            model: Autopeca,
            as: "autopeca",
          }),
        ]),
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Perfil do vendedor recuperado com sucesso",
        data: expect.objectContaining({
          vendedor: expect.objectContaining({
            id: 1,
            nome_completo: "João Vendedor",
          }),
          usuario: expect.objectContaining({
            id: 1,
            email: "vendedor@teste.com",
          }),
          autopeca: expect.objectContaining({
            id: 1,
            razao_social: "Auto Peças LTDA",
          }),
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
      expect(Vendedor.findOne).not.toHaveBeenCalled();
    });

    it("deve retornar erro 404 quando vendedor não é encontrado", async () => {
      // Arrange
      Vendedor.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendedor não encontrado",
        errors: {
          vendedor: "Perfil de vendedor não encontrado para este usuário",
        },
      });
    });

    it("deve retornar erro 403 quando conta está inativa", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: false,
        usuario: {
          id: 1,
          email: "vendedor@teste.com",
          ativo: true,
        },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);

      // Act
      await VendedorOperacoesController.getProfile(req, res);

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
      Vendedor.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorOperacoesController.getProfile(req, res);

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
    beforeEach(() => {
      req.body = { nome_completo: "João Vendedor Atualizado" };
    });

    it("deve atualizar perfil do vendedor com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        usuario: {
          id: 1,
          ativo: true,
        },
        update: jest.fn(),
      };

      const mockVendedorAtualizado = {
        id: 1,
        nome_completo: "João Vendedor Atualizado",
        ativo: true,
        data_criacao: new Date("2024-01-01"),
        data_atualizacao: new Date("2024-01-02"),
        usuario: {
          id: 1,
          email: "vendedor@teste.com",
          tipo_usuario: "vendedor",
          ativo: true,
          data_criacao: new Date("2024-01-01"),
          data_atualizacao: new Date("2024-01-02"),
        },
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      Vendedor.findOne
        .mockResolvedValueOnce(mockVendedor)
        .mockResolvedValueOnce(mockVendedorAtualizado);

      // Act
      await VendedorOperacoesController.updateProfile(req, res);

      // Assert
      expect(mockVendedor.update).toHaveBeenCalledWith(
        { nome_completo: "João Vendedor Atualizado" },
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Perfil do vendedor atualizado com sucesso",
        data: expect.objectContaining({
          vendedor: expect.objectContaining({
            nome_completo: "João Vendedor Atualizado",
          }),
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.updateProfile(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve retornar erro 400 quando nome_completo não é fornecido", async () => {
      // Arrange
      req.body = {};

      // Act
      await VendedorOperacoesController.updateProfile(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Campo obrigatório não informado",
        errors: {
          nome_completo: "Nome completo é obrigatório",
        },
      });
    });

    it("deve retornar erro 400 quando nome_completo é muito curto", async () => {
      // Arrange
      req.body = { nome_completo: "A" };

      // Act
      await VendedorOperacoesController.updateProfile(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          nome_completo: "Nome completo deve ter pelo menos 2 caracteres",
        },
      });
    });

    it("deve retornar erro 404 quando vendedor não é encontrado", async () => {
      // Arrange
      Vendedor.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.updateProfile(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendedor não encontrado",
        errors: {
          vendedor: "Perfil de vendedor não encontrado para este usuário",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Vendedor.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorOperacoesController.updateProfile(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
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

  describe("getDashboard", () => {
    it("deve buscar dashboard do vendedor com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        autopeca_id: 1,
        data_criacao: new Date("2024-01-01"),
        data_atualizacao: new Date("2024-01-02"),
        usuario: {
          id: 1,
          email: "vendedor@teste.com",
          tipo_usuario: "vendedor",
          ativo: true,
          data_criacao: new Date("2024-01-01"),
          data_atualizacao: new Date("2024-01-02"),
        },
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      const mockSolicitacoesAtendidas = [
        { solicitacao_id: 1 },
        { solicitacao_id: 2 },
      ];
      const mockSolicitacoesVistas = [{ solicitacao_id: 3 }];
      const mockSolicitacoesDisponiveis = [];

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findAll
        .mockResolvedValueOnce(mockSolicitacoesAtendidas)
        .mockResolvedValueOnce(mockSolicitacoesVistas);
      Solicitacao.findAll.mockResolvedValue(mockSolicitacoesDisponiveis);
      SolicitacoesAtendimento.count
        .mockResolvedValueOnce(5) // atendimentosHoje
        .mockResolvedValueOnce(20); // totalAtendimentos

      // Act
      await VendedorOperacoesController.getDashboard(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Dashboard do vendedor recuperado com sucesso",
        data: expect.objectContaining({
          vendedor: expect.objectContaining({
            id: 1,
            nome_completo: "João Vendedor",
          }),
          estatisticas: expect.objectContaining({
            atendimentos_hoje: 5,
            total_atendimentos: 20,
            solicitacoes_disponiveis: 0,
            solicitacoes_vistas: 1,
          }),
          solicitacoes: expect.any(Array),
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.getDashboard(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Vendedor.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorOperacoesController.getDashboard(req, res);

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

    it("deve retornar erro 404 quando vendedor não é encontrado", async () => {
      // Arrange
      Vendedor.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.getDashboard(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendedor não encontrado",
        errors: {
          vendedor: "Perfil de vendedor não encontrado para este usuário",
        },
      });
    });

    it("deve retornar erro 403 quando conta está inativa", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        ativo: false,
        usuario: {
          id: 1,
          ativo: true,
        },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);

      // Act
      await VendedorOperacoesController.getDashboard(req, res);

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

    it("deve tratar quando não há solicitações atendidas ou vistas", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        ativo: true,
        autopeca_id: 1,
        data_criacao: new Date("2024-01-01"),
        data_atualizacao: new Date("2024-01-02"),
        usuario: {
          id: 1,
          email: "vendedor@teste.com",
          tipo_usuario: "vendedor",
          ativo: true,
          data_criacao: new Date("2024-01-01"),
          data_atualizacao: new Date("2024-01-02"),
        },
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findAll
        .mockResolvedValueOnce([]) // Nenhuma atendida
        .mockResolvedValueOnce([]); // Nenhuma vista
      Solicitacao.findAll.mockResolvedValue([
        {
          id: 1,
          descricao_peca: "Freio dianteiro",
          placa: "ABC1234",
          marca: "Volkswagen",
          modelo: "Golf",
          ano_fabricacao: 2020,
          ano_modelo: 2021,
          categoria: "carro",
          cor: "Branco",
          cidade_atendimento: "São Paulo",
          uf_atendimento: "SP",
          origem_dados_veiculo: "manual",
          data_criacao: new Date(),
          status_cliente: "ativa",
          imagens: [],
        },
      ]);
      SolicitacoesAtendimento.count
        .mockResolvedValueOnce(0) // atendimentosHoje
        .mockResolvedValueOnce(0); // totalAtendimentos

      // Act
      await VendedorOperacoesController.getDashboard(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Dashboard do vendedor recuperado com sucesso",
        data: expect.objectContaining({
          estatisticas: expect.objectContaining({
            atendimentos_hoje: 0,
            total_atendimentos: 0,
            solicitacoes_disponiveis: 1,
            solicitacoes_vistas: 0,
          }),
        }),
      });
    });
  });

  describe("getSolicitacoesDisponiveis", () => {
    it("deve listar solicitações disponíveis com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      const mockSolicitacoesAtendidas = [{ solicitacao_id: 1 }];
      const mockSolicitacoesVistas = [{ solicitacao_id: 2 }];
      const mockSolicitacoesDisponiveis = [
        {
          id: 3,
          descricao_peca: "Freio dianteiro",
          placa: "ABC1234",
          marca: "Volkswagen",
          modelo: "Golf",
          ano_fabricacao: 2020,
          ano_modelo: 2020,
          categoria: "Passeio",
          cor: "Branco",
          cidade_atendimento: "São Paulo",
          uf_atendimento: "SP",
          origem_dados_veiculo: "api",
          data_criacao: new Date(),
          status_cliente: "ativa",
          imagens: [],
        },
      ];

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findAll
        .mockResolvedValueOnce(mockSolicitacoesAtendidas)
        .mockResolvedValueOnce(mockSolicitacoesVistas);
      Solicitacao.findAll.mockResolvedValue(mockSolicitacoesDisponiveis);

      // Act
      await VendedorOperacoesController.getSolicitacoesDisponiveis(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações disponíveis recuperadas com sucesso",
        data: expect.objectContaining({
          solicitacoes: expect.arrayContaining([
            expect.objectContaining({
              id: 3,
              descricao_peca: "Freio dianteiro",
              status: "disponivel",
            }),
          ]),
          total: 1,
          filtros: expect.objectContaining({
            cidade: "São Paulo",
            uf: "SP",
            status: "ativa",
          }),
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.getSolicitacoesDisponiveis(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Vendedor.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorOperacoesController.getSolicitacoesDisponiveis(req, res);

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

  describe("marcarComoAtendida", () => {
    beforeEach(() => {
      req.params = { solicitacaoId: "1" };
    });

    it("deve marcar solicitação como atendida com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        nome_completo: "João Vendedor",
        autopeca_id: 1,
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
        },
      };

      const mockSolicitacao = {
        id: 1,
        descricao_peca: "Freio dianteiro",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        placa: "ABC1234",
        cliente: {
          id: 1,
          nome_completo: "Cliente Teste",
          celular: "(11) 99999-9999",
        },
      };

      const mockAtendimento = {
        id: 1,
        solicitacao_id: 1,
        autopeca_id: 1,
        vendedor_id: 1,
        status_atendimento: "atendida",
        data_marcacao: new Date(),
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null) // atendimentoExistente
        .mockResolvedValueOnce(null); // vendedorAtendimentoExistente
      SolicitacoesAtendimento.create.mockResolvedValue(mockAtendimento);
      SolicitacoesAtendimento.destroy.mockResolvedValue(0);

      const NotificationService = require("../../../src/services/notificationService");
      NotificationService.notificarClienteSolicitacaoAtendida.mockResolvedValue(
        null
      );
      NotificationService.notificarAutopecaVendedorAtendeu.mockResolvedValue(
        null
      );
      NotificationService.notificarOutrosVendedoresPerderam.mockResolvedValue(
        []
      );

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(SolicitacoesAtendimento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          solicitacao_id: "1",
          autopeca_id: 1,
          vendedor_id: 1,
          status_atendimento: "atendida",
        }),
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação marcada como atendida com sucesso",
        data: expect.objectContaining({
          atendimento: expect.objectContaining({
            id: 1,
            solicitacao_id: "1",
          }),
          link_whatsapp: expect.stringContaining("wa.me"),
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve remover ':' do início do ID se existir", async () => {
      // Arrange
      req.params.solicitacaoId = ":1";
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
        },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(Solicitacao.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "1", // ID sem o ":"
            status_cliente: "ativa",
          }),
          include: expect.any(Array),
          transaction: mockTransaction,
        })
      );
    });

    it("deve retornar erro 404 quando solicitação não é encontrada", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
        },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não encontrada ou inativa",
        errors: {
          solicitacao: "Solicitação não existe ou não está mais ativa",
        },
      });
    });

    it("deve retornar erro 409 quando solicitação já foi atendida", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
        },
      };

      const mockSolicitacao = {
        id: 1,
        cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
      };

      const mockAtendimentoExistente = {
        id: 1,
        status_atendimento: "atendida",
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne.mockResolvedValue(
        mockAtendimentoExistente
      );

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação já atendida",
        errors: {
          atendimento: "Este vendedor já atendeu esta solicitação",
        },
      });
    });

    it("deve retornar erro 409 quando outro vendedor da mesma autopeça já atendeu", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
        },
      };

      const mockSolicitacao = {
        id: 1,
        cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null) // atendimentoExistente
        .mockResolvedValueOnce({
          // vendedorAtendimentoExistente
          id: 2,
          status_atendimento: "atendida",
        });

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Conflito de atendimento",
        errors: {
          conflito: "Outro vendedor desta autopeça já atendeu esta solicitação",
        },
      });
    });

    it("deve atualizar atendimento existente quando já existe registro com status 'lida'", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
        },
      };

      const mockSolicitacao = {
        id: 1,
        cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
      };

      const mockAtendimentoExistente = {
        id: 1,
        status_atendimento: "lida",
        save: jest.fn(),
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(mockAtendimentoExistente)
        .mockResolvedValueOnce(null);
      SolicitacoesAtendimento.destroy.mockResolvedValue(0);

      const NotificationService = require("../../../src/services/notificationService");
      NotificationService.notificarClienteSolicitacaoAtendida.mockResolvedValue(
        null
      );
      NotificationService.notificarAutopecaVendedorAtendeu.mockResolvedValue(
        null
      );
      NotificationService.notificarOutrosVendedoresPerderam.mockResolvedValue(
        []
      );

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(mockAtendimentoExistente.status_atendimento).toBe("atendida");
      expect(mockAtendimentoExistente.save).toHaveBeenCalledWith({
        transaction: mockTransaction,
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando ocorre SequelizeValidationError", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças Silva",
        },
      };

      const mockSolicitacao = {
        id: 1,
        cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const validationError = new Error("Validation error");
      validationError.name = "SequelizeValidationError";
      validationError.errors = [
        { path: "solicitacao_id", message: "Invalid solicitacao_id" },
      ];

      SolicitacoesAtendimento.create.mockRejectedValue(validationError);

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro de validação nos dados",
        errors: {
          solicitacao_id: "Invalid solicitacao_id",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Vendedor.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorOperacoesController.marcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
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

  describe("getSolicitacoesVistas", () => {
    it("deve listar solicitações vistas com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      const mockSolicitacoesVistas = [
        {
          id: 1,
          data_marcacao: new Date(),
          solicitacao: {
            id: 1,
            descricao_peca: "Freio dianteiro",
            placa: "ABC1234",
            marca: "Volkswagen",
            modelo: "Golf",
            ano_fabricacao: 2020,
            ano_modelo: 2020,
            categoria: "Passeio",
            cor: "Branco",
            cidade_atendimento: "São Paulo",
            uf_atendimento: "SP",
            origem_dados_veiculo: "api",
            data_criacao: new Date(),
            status_cliente: "ativa",
            imagens: [],
          },
        },
      ];

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findAll.mockResolvedValue(mockSolicitacoesVistas);

      // Act
      await VendedorOperacoesController.getSolicitacoesVistas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações vistas recuperadas com sucesso",
        data: expect.objectContaining({
          solicitacoes: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              descricao_peca: "Freio dianteiro",
              status: "vista",
            }),
          ]),
          total: 1,
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.getSolicitacoesVistas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Vendedor.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorOperacoesController.getSolicitacoesVistas(req, res);

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

  describe("getSolicitacoesAtendidas", () => {
    it("deve listar solicitações atendidas com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      const mockAtendimentos = [
        {
          id: 1,
          data_marcacao: new Date(),
          solicitacao: {
            id: 1,
            descricao_peca: "Freio dianteiro",
            placa: "ABC1234",
            marca: "Volkswagen",
            modelo: "Golf",
            ano_fabricacao: 2020,
            ano_modelo: 2020,
            categoria: "Passeio",
            cor: "Branco",
            cidade_atendimento: "São Paulo",
            uf_atendimento: "SP",
            origem_dados_veiculo: "api",
            data_criacao: new Date(),
            status_cliente: "ativa",
            imagens: [],
          },
        },
      ];

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findAll.mockResolvedValue(mockAtendimentos);

      // Act
      await VendedorOperacoesController.getSolicitacoesAtendidas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações atendidas recuperadas com sucesso",
        data: expect.objectContaining({
          solicitacoes: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              descricao_peca: "Freio dianteiro",
              status: "atendida",
            }),
          ]),
          total: 1,
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.getSolicitacoesAtendidas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Vendedor.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorOperacoesController.getSolicitacoesAtendidas(req, res);

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

  describe("marcarComoVista", () => {
    beforeEach(() => {
      req.params = { solicitacaoId: "1" };
    });

    it("deve marcar solicitação como vista com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };

      const mockAtendimento = {
        id: 1,
        solicitacao_id: "1",
        status_atendimento: "lida",
        data_marcacao: new Date(),
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne.mockResolvedValue(null);
      SolicitacoesAtendimento.create.mockResolvedValue(mockAtendimento);

      // Act
      await VendedorOperacoesController.marcarComoVista(req, res);

      // Assert
      expect(SolicitacoesAtendimento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          solicitacao_id: "1",
          autopeca_id: 1,
          vendedor_id: 1,
          status_atendimento: "lida",
        }),
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação marcada como vista com sucesso",
        data: expect.objectContaining({
          atendimento: expect.objectContaining({
            id: 1,
            solicitacao_id: "1",
            status_atendimento: "vista",
          }),
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.marcarComoVista(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve retornar erro 404 quando solicitação não é encontrada", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.marcarComoVista(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não encontrada ou inativa",
        errors: {
          solicitacao: "Solicitação não está disponível na sua região",
        },
      });
    });

    it("deve retornar erro 409 quando solicitação já foi atendida", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };

      const mockAtendimentoExistente = {
        id: 1,
        status_atendimento: "atendida",
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne.mockResolvedValue(
        mockAtendimentoExistente
      );

      // Act
      await VendedorOperacoesController.marcarComoVista(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação já foi atendida por você",
        errors: {
          status: "Não é possível marcar como vista uma solicitação já atendida",
        },
      });
    });

    it("deve retornar sucesso quando solicitação já está marcada como vista", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };

      const mockAtendimentoExistente = {
        id: 1,
        solicitacao_id: "1",
        status_atendimento: "lida",
        data_marcacao: new Date(),
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne.mockResolvedValue(
        mockAtendimentoExistente
      );

      // Act
      await VendedorOperacoesController.marcarComoVista(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação já estava marcada como vista",
        data: expect.objectContaining({
          atendimento: expect.objectContaining({
            id: 1,
            solicitacao_id: "1",
            status_atendimento: "vista",
          }),
        }),
      });
    });

    it("deve remover ':' do início do ID se existir", async () => {
      // Arrange
      req.params.solicitacaoId = ":1";
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      Solicitacao.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.marcarComoVista(req, res);

      // Assert
      expect(Solicitacao.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "1", // ID sem o ":"
            status_cliente: "ativa",
            cidade_atendimento: "São Paulo",
            uf_atendimento: "SP",
          }),
          transaction: mockTransaction,
        })
      );
    });
  });

  describe("desmarcarComoVista", () => {
    beforeEach(() => {
      req.params = { solicitacaoId: "1" };
    });

    it("deve desmarcar solicitação como vista com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
      };

      const mockAtendimento = {
        id: 1,
        solicitacao_id: "1",
        destroy: jest.fn(),
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findOne.mockResolvedValue(mockAtendimento);

      // Act
      await VendedorOperacoesController.desmarcarComoVista(req, res);

      // Assert
      expect(mockAtendimento.destroy).toHaveBeenCalledWith({
        transaction: mockTransaction,
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação retornada ao dashboard com sucesso",
        data: {
          solicitacao_id: "1",
        },
      });
    });

    it("deve retornar erro 404 quando atendimento não é encontrado", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.desmarcarComoVista(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não está marcada como vista",
        errors: {
          solicitacao:
            "Não foi encontrada marcação de visualização para esta solicitação",
        },
      });
    });
  });

  describe("desmarcarComoAtendida", () => {
    beforeEach(() => {
      req.params = { solicitacaoId: "1" };
    });

    it("deve desmarcar solicitação como atendida com sucesso", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
      };

      const mockAtendimento = {
        id: 1,
        solicitacao_id: "1",
        destroy: jest.fn(),
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findOne.mockResolvedValue(mockAtendimento);

      // Act
      await VendedorOperacoesController.desmarcarComoAtendida(req, res);

      // Assert
      expect(mockAtendimento.destroy).toHaveBeenCalledWith({
        transaction: mockTransaction,
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação reaberta com sucesso",
        data: {
          solicitacao_id: "1",
        },
      });
    });

    it("deve retornar erro 404 quando atendimento não é encontrado", async () => {
      // Arrange
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.desmarcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Atendimento não encontrado",
        errors: {
          atendimento:
            "Não foi encontrado registro de atendimento para esta solicitação",
        },
      });
    });

    it("deve retornar erro 403 quando usuário não é vendedor", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VendedorOperacoesController.desmarcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          tipo_usuario: "Esta operação é exclusiva para vendedores",
        },
      });
    });

    it("deve retornar erro 404 quando vendedor não é encontrado", async () => {
      // Arrange
      Vendedor.findOne.mockResolvedValue(null);

      // Act
      await VendedorOperacoesController.desmarcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendedor não encontrado",
        errors: {
          vendedor: "Perfil de vendedor não encontrado para este usuário",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Vendedor.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await VendedorOperacoesController.desmarcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message:
            "Ocorreu um erro ao reabrir a solicitação. Tente novamente mais tarde.",
        },
      });
    });

    it("deve remover ':' do início do ID se existir", async () => {
      // Arrange
      req.params.solicitacaoId = ":1";
      const mockVendedor = {
        id: 1,
        autopeca_id: 1,
      };
      const mockAtendimento = {
        id: 1,
        solicitacao_id: "1",
        destroy: jest.fn(),
      };

      Vendedor.findOne.mockResolvedValue(mockVendedor);
      SolicitacoesAtendimento.findOne.mockResolvedValue(mockAtendimento);

      // Act
      await VendedorOperacoesController.desmarcarComoAtendida(req, res);

      // Assert
      expect(SolicitacoesAtendimento.findOne).toHaveBeenCalledWith({
        where: {
          solicitacao_id: "1",
          autopeca_id: 1,
          vendedor_id: 1,
          status_atendimento: "atendida",
        },
        transaction: mockTransaction,
      });
    });
  });
});

