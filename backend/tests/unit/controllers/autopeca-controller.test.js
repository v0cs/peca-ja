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

    Autopeca.sequelize.transaction.mockResolvedValue(mockTransaction);
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
});

