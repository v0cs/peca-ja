const AutopecaController = require("../../../src/controllers/autopecaController");
const {
  Autopeca,
  Usuario,
  Solicitacao,
  SolicitacoesAtendimento,
  ImagemSolicitacao,
} = require("../../../src/models");
const { Op } = require("sequelize");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Autopeca: {
    sequelize: {
      transaction: jest.fn(),
    },
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Usuario: {
    findOne: jest.fn(),
  },
  Solicitacao: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  SolicitacoesAtendimento: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
  ImagemSolicitacao: {
    findAll: jest.fn(),
  },
  Cliente: {
    findOne: jest.fn(),
  },
  Vendedor: {
    findAll: jest.fn(),
  },
  Op: {
    and: jest.fn(),
    iLike: jest.fn(),
    ne: jest.fn(),
    or: jest.fn(),
  },
}));

// Mock do notificationService
jest.mock("../../../src/services/notificationService", () => ({
  notificarClienteSolicitacaoAtendida: jest.fn(),
}));

describe("AutopecaController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

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

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    // Reconfigurar mock de transaction após clearAllMocks
    if (Autopeca.sequelize) {
      Autopeca.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
    }
  });

  describe("getProfile", () => {
    it("deve buscar perfil da autopeça com sucesso", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        razao_social: "Auto Peças LTDA",
        nome_fantasia: "Auto Peças Silva",
        cnpj: "11222333000181",
        telefone: "(11)99999-9999",
        endereco_rua: "Rua das Flores",
        endereco_numero: "123",
        endereco_bairro: "Centro",
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
        endereco_cep: "01234567",
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        usuario: {
          id: 1,
          email: "autopeca@teste.com",
          tipo_usuario: "autopeca",
          ativo: true,
          termos_aceitos: true,
          data_aceite_terms: new Date(),
          consentimento_marketing: false,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);

      // Act
      await AutopecaController.getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Perfil da autopeça recuperado com sucesso",
        data: expect.objectContaining({
          autopeca: expect.objectContaining({
            id: 1,
            razao_social: "Auto Peças LTDA",
            endereco_cidade: "São Paulo",
          }),
          usuario: expect.objectContaining({
            id: 1,
            email: "autopeca@teste.com",
            tipo_usuario: "autopeca",
          }),
        }),
      });
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await AutopecaController.getProfile(req, res);

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

    it("deve retornar erro quando conta está inativa", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        usuario: {
          id: 1,
          ativo: false,
        },
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);

      // Act
      await AutopecaController.getProfile(req, res);

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

    it("deve retornar erro 404 quando autopeça não é encontrada", async () => {
      // Arrange
      Autopeca.findOne.mockResolvedValue(null);

      // Act
      await AutopecaController.getProfile(req, res);

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

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await AutopecaController.getProfile(req, res);

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
      req.body = {
        razao_social: "Auto Peças LTDA Atualizada",
        telefone: "(11)88888-8888",
      };
    });

    it("deve atualizar perfil da autopeça com sucesso", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        razao_social: "Auto Peças LTDA",
        update: jest.fn().mockResolvedValue(true),
        usuario: {
          id: 1,
          ativo: true,
        },
      };
      const mockAutopecaAtualizada = {
        id: 1,
        razao_social: "Auto Peças LTDA Atualizada",
        telefone: "(11)88888-8888",
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        usuario: {
          id: 1,
          email: "autopeca@teste.com",
          tipo_usuario: "autopeca",
          ativo: true,
          termos_aceitos: true,
          data_aceite_terms: new Date(),
          consentimento_marketing: false,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
      };

      Autopeca.findOne.mockResolvedValueOnce(mockAutopeca);
      Autopeca.findOne.mockResolvedValueOnce(mockAutopecaAtualizada);

      // Act
      await AutopecaController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Perfil da autopeça atualizado com sucesso",
        data: expect.objectContaining({
          autopeca: expect.objectContaining({
            id: 1,
            razao_social: "Auto Peças LTDA Atualizada",
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando não há campos para atualizar", async () => {
      // Arrange
      req.body = {};

      // Act
      await AutopecaController.updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Nenhum campo válido para atualização",
        errors: expect.objectContaining({
          campos: expect.stringContaining("Campos permitidos"),
        }),
      });
    });

    it("deve retornar erro 404 quando autopeça não é encontrada", async () => {
      // Arrange
      req.body = { razao_social: "Nova Razão Social" };
      Autopeca.findOne.mockResolvedValue(null);

      // Act
      await AutopecaController.updateProfile(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Autopeça não encontrada",
        errors: {
          autopeca: "Perfil de autopeça não encontrado para este usuário",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      req.body = { razao_social: "Nova Razão Social" };
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await AutopecaController.updateProfile(req, res);

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

  describe("getSolicitacoesDisponiveis", () => {
    it("deve listar solicitações disponíveis com sucesso", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      };
      const mockSolicitacoes = [
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
          status_cliente: "ativa",
          origem_dados_veiculo: "manual",
          data_criacao: new Date(),
          atendimentos: [],
          imagens: [],
        },
      ];

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findAll.mockResolvedValue(mockSolicitacoes);

      // Act
      await AutopecaController.getSolicitacoesDisponiveis(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações disponíveis recuperadas com sucesso",
        data: expect.objectContaining({
          solicitacoes: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              descricao_peca: "Freio dianteiro",
              placa: "ABC1234",
            }),
          ]),
          total: 1,
        }),
      });
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await AutopecaController.getSolicitacoesDisponiveis(req, res);

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

    it("deve retornar erro 404 quando autopeça não é encontrada", async () => {
      // Arrange
      Autopeca.findOne.mockResolvedValue(null);

      // Act
      await AutopecaController.getSolicitacoesDisponiveis(req, res);

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

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await AutopecaController.getSolicitacoesDisponiveis(req, res);

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

    it("deve filtrar solicitações já atendidas", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      };
      const mockSolicitacoes = [
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
          status_cliente: "ativa",
          origem_dados_veiculo: "manual",
          data_criacao: new Date(),
          atendimentos: [
            {
              id: 1,
              status_atendimento: "atendida",
              vendedor_id: 1,
            },
          ],
          imagens: [],
        },
        {
          id: 2,
          descricao_peca: "Pneu",
          placa: "XYZ5678",
          marca: "Ford",
          modelo: "Focus",
          ano_fabricacao: 2019,
          ano_modelo: 2019,
          categoria: "carro",
          cor: "Preto",
          cidade_atendimento: "São Paulo",
          uf_atendimento: "SP",
          status_cliente: "ativa",
          origem_dados_veiculo: "manual",
          data_criacao: new Date(),
          atendimentos: [],
          imagens: [],
        },
      ];

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findAll.mockResolvedValue(mockSolicitacoes);

      // Act
      await AutopecaController.getSolicitacoesDisponiveis(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações disponíveis recuperadas com sucesso",
        data: expect.objectContaining({
          total: 1, // Apenas a segunda solicitação (não atendida)
        }),
      });
    });

    it("deve filtrar solicitações marcadas como lidas pela autopeça", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      };
      const mockSolicitacoes = [
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
          status_cliente: "ativa",
          origem_dados_veiculo: "manual",
          data_criacao: new Date(),
          atendimentos: [
            {
              id: 1,
              status_atendimento: "lida",
              vendedor_id: null, // Marcada pela autopeça
            },
          ],
          imagens: [],
        },
        {
          id: 2,
          descricao_peca: "Pneu",
          placa: "XYZ5678",
          marca: "Ford",
          modelo: "Focus",
          ano_fabricacao: 2019,
          ano_modelo: 2019,
          categoria: "carro",
          cor: "Preto",
          cidade_atendimento: "São Paulo",
          uf_atendimento: "SP",
          status_cliente: "ativa",
          origem_dados_veiculo: "manual",
          data_criacao: new Date(),
          atendimentos: [],
          imagens: [],
        },
      ];

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findAll.mockResolvedValue(mockSolicitacoes);

      // Act
      await AutopecaController.getSolicitacoesDisponiveis(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações disponíveis recuperadas com sucesso",
        data: expect.objectContaining({
          total: 1, // Apenas a segunda solicitação (não marcada como lida)
        }),
      });
    });
  });

  describe("marcarComoAtendida", () => {
    beforeEach(() => {
      req.params = { solicitacaoId: "1" };
    });

    it("deve marcar solicitação como atendida com sucesso", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        razao_social: "Auto Peças LTDA",
        nome_fantasia: "Auto Peças Silva",
      };
      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        placa: "ABC1234",
        cliente: {
          id: 1,
          nome_completo: "João Cliente",
          celular: "(11)99999-9999",
        },
      };
      const mockAtendimento = {
        id: 1,
        solicitacao_id: 1,
        autopeca_id: 1,
        status_atendimento: "atendida",
        data_marcacao: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne.mockResolvedValue(null);
      SolicitacoesAtendimento.create.mockResolvedValue(mockAtendimento);

      // Act
      await AutopecaController.marcarComoAtendida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação marcada como atendida com sucesso",
        data: expect.objectContaining({
          atendimento: expect.objectContaining({
            id: 1,
            status_atendimento: "atendida",
          }),
          link_whatsapp: expect.any(String),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando solicitação já foi atendida", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
      };
      const mockAtendimentoExistente = {
        id: 1,
        status_atendimento: "atendida",
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne.mockResolvedValue(mockAtendimentoExistente);

      // Act
      await AutopecaController.marcarComoAtendida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação já atendida",
        errors: {
          atendimento: "Esta autopeça já atendeu esta solicitação",
        },
      });
    });
  });

  describe("getSolicitacoesAtendidas", () => {
    it("deve listar solicitações atendidas com sucesso", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
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
          vendedor: {
            id: 1,
            nome_completo: "João Vendedor",
          },
        },
      ];

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findAll.mockResolvedValue(mockAtendimentos);

      // Act
      await AutopecaController.getSolicitacoesAtendidas(req, res);

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
              vendedor: expect.objectContaining({
                id: 1,
                nome_completo: "João Vendedor",
              }),
            }),
          ]),
          total: 1,
        }),
      });
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await AutopecaController.getSolicitacoesAtendidas(req, res);

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
      await AutopecaController.getSolicitacoesAtendidas(req, res);

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

    it("deve filtrar atendimentos sem solicitação", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockAtendimentos = [
        {
          id: 1,
          solicitacao: null, // Solicitação deletada
        },
        {
          id: 2,
          solicitacao: {
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
        },
      ];

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findAll.mockResolvedValue(mockAtendimentos);

      // Act
      await AutopecaController.getSolicitacoesAtendidas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações atendidas recuperadas com sucesso",
        data: expect.objectContaining({
          total: 1, // Apenas 1, pois a primeira foi filtrada
        }),
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await AutopecaController.getSolicitacoesAtendidas(req, res);

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

    it("deve tratar atendimento sem vendedor corretamente", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
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
          vendedor: null, // Sem vendedor
        },
      ];

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findAll.mockResolvedValue(mockAtendimentos);

      // Act
      await AutopecaController.getSolicitacoesAtendidas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitações atendidas recuperadas com sucesso",
        data: expect.objectContaining({
          solicitacoes: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              vendedor: null,
            }),
          ]),
        }),
      });
    });
  });

  describe("getSolicitacoesVistas", () => {
    it("deve listar solicitações vistas com sucesso", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
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
        },
      ];

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findAll.mockResolvedValue(mockAtendimentos);

      // Act
      await AutopecaController.getSolicitacoesVistas(req, res);

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
            }),
          ]),
          total: 1,
        }),
      });
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await AutopecaController.getSolicitacoesVistas(req, res);

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
      await AutopecaController.getSolicitacoesVistas(req, res);

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

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await AutopecaController.getSolicitacoesVistas(req, res);

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

  describe("desmarcarComoVista", () => {
    beforeEach(() => {
      req.params = { solicitacaoId: "1" };
    });

    it("deve desmarcar solicitação como vista com sucesso", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockAtendimento = {
        id: 1,
        solicitacao_id: "1",
        autopeca_id: 1,
        status_atendimento: "lida",
        destroy: jest.fn().mockResolvedValue(true),
      };
      const mockSolicitacao = {
        id: 1,
        descricao_peca: "Freio dianteiro",
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findOne.mockResolvedValue(mockAtendimento);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await AutopecaController.desmarcarComoVista(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação retornada ao dashboard com sucesso",
        data: {
          solicitacao_id: "1",
        },
      });
      expect(mockAtendimento.destroy).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await AutopecaController.desmarcarComoVista(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando atendimento não é encontrado", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findOne.mockResolvedValue(null);

      // Act
      await AutopecaController.desmarcarComoVista(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Atendimento não encontrado",
        errors: {
          atendimento:
            "Esta solicitação não foi marcada como vista por esta autopeça",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve remover ':' do início do ID se existir", async () => {
      // Arrange
      req.params = { solicitacaoId: ":1" };
      const mockAutopeca = { id: 1 };
      const mockAtendimento = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };
      const mockSolicitacao = { id: 1 };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findOne.mockResolvedValue(mockAtendimento);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await AutopecaController.desmarcarComoVista(req, res);

      // Assert
      expect(SolicitacoesAtendimento.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            autopeca_id: 1,
            solicitacao_id: "1", // ID sem o ":"
            status_atendimento: "lida",
          }),
          transaction: expect.any(Object),
        })
      );
    });
  });

  describe("desmarcarComoAtendida", () => {
    beforeEach(() => {
      req.params = { solicitacaoId: "1" };
    });

    it("deve desmarcar solicitação como atendida com sucesso", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockAtendimento = {
        id: 1,
        solicitacao_id: "1",
        autopeca_id: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };
      const mockSolicitacao = {
        id: 1,
        descricao_peca: "Freio dianteiro",
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findOne.mockResolvedValue(mockAtendimento);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);

      // Act
      await AutopecaController.desmarcarComoAtendida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação desmarcada como atendida com sucesso",
        data: {
          solicitacao_id: "1",
        },
      });
      expect(mockAtendimento.destroy).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await AutopecaController.desmarcarComoAtendida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando atendimento não é encontrado", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      SolicitacoesAtendimento.findOne.mockResolvedValue(null);

      // Act
      await AutopecaController.desmarcarComoAtendida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Atendimento não encontrado",
        errors: {
          atendimento: "Esta solicitação não foi atendida por esta autopeça",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await AutopecaController.desmarcarComoAtendida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro ao desmarcar a solicitação como atendida",
        },
      });
    });
  });

  describe("marcarComoLida", () => {
    beforeEach(() => {
      req.params = { solicitacaoId: "1" };
    });

    it("deve marcar solicitação como lida com sucesso", async () => {
      // Arrange
      const mockAutopeca = { id: 1 };
      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        descricao_peca: "Freio dianteiro",
      };
      const mockAtendimento = {
        id: 1,
        solicitacao_id: "1",
        autopeca_id: 1,
        status_atendimento: "lida",
        data_marcacao: new Date(),
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne.mockResolvedValue(null);
      SolicitacoesAtendimento.create.mockResolvedValue(mockAtendimento);

      // Act
      await AutopecaController.marcarComoLida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação marcada como vista com sucesso",
        data: expect.objectContaining({
          atendimento: expect.objectContaining({
            id: 1,
            status_atendimento: "lida",
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando usuário não é autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await AutopecaController.marcarComoLida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando solicitação já foi marcada como atendida", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      };
      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };
      const mockAtendimentoAtendido = {
        id: 1,
        status_atendimento: "atendida",
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(mockAtendimentoAtendido) // Primeira busca: já atendida
        .mockResolvedValueOnce(null); // Segunda busca: não existe como lida

      // Act
      await AutopecaController.marcarComoLida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação já foi marcada como atendida",
        errors: {
          status: "Não é possível marcar como vista uma solicitação já atendida",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando solicitação não é encontrada", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      };
      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findOne.mockResolvedValue(null);

      // Act
      await AutopecaController.marcarComoLida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Solicitação não encontrada ou inativa",
        errors: {
          solicitacao: "Solicitação não existe ou não está mais ativa na sua cidade",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      Autopeca.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await AutopecaController.marcarComoLida(req, res);

      // Assert
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro ao marcar a solicitação como vista",
        },
      });
    });

    it("deve atualizar atendimento existente quando já existe registro", async () => {
      // Arrange
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
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
        autopeca_id: 1,
        vendedor_id: null,
        status_atendimento: "vista",
        data_marcacao: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      // Primeira busca: verifica se já está atendida (retorna null)
      // Segunda busca: busca atendimento com vendedor_id null (retorna existente)
      // Resetar o mock antes de configurá-lo para garantir que está limpo
      SolicitacoesAtendimento.findOne.mockReset();
      // Usar mockImplementationOnce para garantir que o mock funciona corretamente
      SolicitacoesAtendimento.findOne
        .mockImplementationOnce(() => Promise.resolve(null)) // Primeira busca: status_atendimento: "atendida"
        .mockImplementationOnce(() => Promise.resolve(mockAtendimentoExistente)); // Segunda busca: vendedor_id: null

      // Act
      await AutopecaController.marcarComoLida(req, res);

      // Assert
      // Verificar que foram feitas duas buscas no SolicitacoesAtendimento.findOne
      expect(SolicitacoesAtendimento.findOne).toHaveBeenCalledTimes(2);
      // Verificar que o create NÃO foi chamado (pois o atendimento já existe)
      expect(SolicitacoesAtendimento.create).not.toHaveBeenCalled();
      // Verificar que o save foi chamado (o status é atualizado dentro do método antes de salvar)
      // O save é chamado no bloco else quando o atendimento já existe
      expect(mockAtendimentoExistente.save).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      // Verificar que a resposta contém o status correto (o código atualiza o status antes de retornar)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Solicitação marcada como vista com sucesso",
        data: expect.objectContaining({
          atendimento: expect.objectContaining({
            id: 1,
            solicitacao_id: "1",
            autopeca_id: 1,
            status_atendimento: "lida",
          }),
        }),
      });
    });

    it("deve remover ':' do início do ID se existir", async () => {
      // Arrange
      req.params.solicitacaoId = ":1";
      const mockAutopeca = {
        id: 1,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      };
      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };

      Autopeca.findOne.mockResolvedValue(mockAutopeca);
      Solicitacao.findOne.mockResolvedValue(mockSolicitacao);
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null) // Primeira busca (atendida) retorna null
        .mockResolvedValueOnce(null); // Segunda busca (lida) retorna null
      SolicitacoesAtendimento.create.mockResolvedValue({
        id: 1,
        solicitacao_id: "1",
        autopeca_id: 1,
        status_atendimento: "lida",
      });

      // Act
      await AutopecaController.marcarComoLida(req, res);

      // Assert
      expect(Solicitacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "1",
          status_cliente: "ativa",
          cidade_atendimento: "São Paulo",
          uf_atendimento: "SP",
        },
        transaction: mockTransaction,
      });
    });
  });
});

