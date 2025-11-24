const { createModelMock, setupTransactionMock } = require("../../helpers/mockFactory");

// Criar mocks dos models ANTES de importar o controller
const mockVendedor = createModelMock();
const mockUsuario = createModelMock();
const mockAutopeca = createModelMock();
const mockSolicitacao = createModelMock();
const mockSolicitacoesAtendimento = createModelMock();
const mockImagemSolicitacao = createModelMock();

jest.mock("../../../src/models", () => ({
  Vendedor: mockVendedor,
  Usuario: mockUsuario,
  Autopeca: mockAutopeca,
  Solicitacao: mockSolicitacao,
  SolicitacoesAtendimento: mockSolicitacoesAtendimento,
  ImagemSolicitacao: mockImagemSolicitacao,
  Op: {
    and: Symbol("Op.and"),
    or: Symbol("Op.or"),
    ne: Symbol("Op.ne"),
    eq: Symbol("Op.eq"),
  },
}));

jest.mock("sequelize", () => ({
  Op: {
    and: Symbol("Op.and"),
    or: Symbol("Op.or"),
    ne: Symbol("Op.ne"),
    eq: Symbol("Op.eq"),
  },
}));

jest.mock("../../../src/services/notificationService", () => ({
  notificarClienteSolicitacaoAtendida: jest.fn(),
  notificarAutopecaVendedorAtendeu: jest.fn(),
  notificarOutrosVendedoresPerderam: jest.fn(),
}));

// Importar após os mocks
const VendedorOperacoesController = require("../../../src/controllers/vendedorOperacoesController");
const { Vendedor, Usuario, Autopeca, Solicitacao, SolicitacoesAtendimento, ImagemSolicitacao } = require("../../../src/models");

describe("VendedorOperacoesController - Testes de Concorrência", () => {
  let req1, req2, res1, res2, mockTransaction1, mockTransaction2;

  beforeEach(() => {
    jest.clearAllMocks();

    req1 = {
      user: { userId: 2, tipo: "vendedor" },
      params: {},
      body: {},
    };

    req2 = {
      user: { userId: 3, tipo: "vendedor" },
      params: {},
      body: {},
    };

    res1 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockTransaction1 = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    mockTransaction2 = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    SolicitacoesAtendimento.sequelize.transaction
      .mockImplementationOnce(() => Promise.resolve(mockTransaction1))
      .mockImplementationOnce(() => Promise.resolve(mockTransaction2));
    
    // Mock Vendedor transactions também (usado em marcarComoVista)
    Vendedor.sequelize.transaction
      .mockResolvedValueOnce(mockTransaction1)
      .mockResolvedValueOnce(mockTransaction2);
  });

  describe("⚡ Race Condition - Dois Vendedores Marcando Mesma Solicitação", () => {
    it("deve prevenir que dois vendedores marquem mesma solicitação como atendida simultaneamente", async () => {
      const solicitacaoId = "1";

      req1.params = { solicitacaoId: solicitacaoId };
      req2.params = { solicitacaoId: solicitacaoId };

      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        cliente_id: 1,
        imagens: [],
      };

      const mockVendedor1 = {
        id: 1,
        autopeca_id: 1,
        usuario_id: 2,
        ativo: true,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      // IMPORTANTE: O código verifica conflitos apenas dentro da MESMA autopeça
      // Para testar race condition real, ambos devem ser da mesma autopeça
      const mockVendedor2 = {
        id: 2,
        autopeca_id: 1, // MESMA autopeça que vendedor1
        usuario_id: 3,
        ativo: true,
        autopeca: {
          id: 1, // MESMA autopeça
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      // Primeiro vendedor: encontra solicitação disponível
      Solicitacao.findOne.mockResolvedValueOnce({
        ...mockSolicitacao,
        cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
      });
      Vendedor.findOne.mockResolvedValueOnce(mockVendedor1);
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null) // Verificação do próprio vendedor
        .mockResolvedValueOnce(null); // Verificação de outro vendedor da mesma autopeça

      // Criar atendimento para o primeiro vendedor
      const mockAtendimento1 = {
        id: 1,
        solicitacao_id: 1,
        vendedor_id: 1,
        autopeca_id: 1,
        status_atendimento: "atendida",
        save: jest.fn().mockResolvedValue(true),
      };
      SolicitacoesAtendimento.create.mockResolvedValueOnce(mockAtendimento1);

      // Segundo vendedor: tenta marcar como atendida
      // IMPORTANTE: O código verifica se OUTRO vendedor da MESMA autopeça já atendeu
      Solicitacao.findOne.mockResolvedValueOnce({
        ...mockSolicitacao,
        cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
      });
      Vendedor.findOne.mockResolvedValueOnce(mockVendedor2);
      // Já existe atendimento de outro vendedor da MESMA autopeça (primeiro vendedor ganhou)
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null) // Verificação do próprio vendedor (vendedor2 ainda não tem registro)
        .mockResolvedValueOnce({
          id: 1,
          solicitacao_id: 1,
          vendedor_id: 1, // vendedor1 já atendeu
          autopeca_id: 1, // MESMA autopeça
          status_atendimento: "atendida",
        }); // Outro vendedor da MESMA autopeça já atendeu

      // Executar ambas as requisições "simultaneamente"
      const promise1 = VendedorOperacoesController.marcarComoAtendida(req1, res1);
      // Pequeno delay para simular race condition
      await new Promise((resolve) => setTimeout(resolve, 5));
      const promise2 = VendedorOperacoesController.marcarComoAtendida(req2, res2);

      await Promise.all([promise1, promise2]);

      // Apenas um deve conseguir marcar como atendida
      expect(SolicitacoesAtendimento.create).toHaveBeenCalledTimes(1);
      // O segundo deve receber erro 409 (conflito)
      expect(res2.status).toHaveBeenCalledWith(409);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Conflito"),
        })
      );
    });

    it("deve prevenir que dois vendedores da mesma autopeça marquem como atendida", async () => {
      const solicitacaoId = "1";

      req1.params = { solicitacaoId: solicitacaoId };
      req2.params = { solicitacaoId: solicitacaoId };

      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        cliente_id: 1,
        imagens: [],
      };

      const mockVendedor1 = {
        id: 1,
        autopeca_id: 1,
        usuario_id: 2,
        ativo: true,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      const mockVendedor2 = {
        id: 2,
        autopeca_id: 1, // Mesma autopeça
        usuario_id: 3,
        ativo: true,
        autopeca: {
          id: 1,
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };

      // Primeiro vendedor marca como atendida
      Solicitacao.findOne.mockResolvedValueOnce({
        ...mockSolicitacao,
        cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
      });
      Vendedor.findOne.mockResolvedValueOnce(mockVendedor1);
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null) // Verificação do próprio vendedor
        .mockResolvedValueOnce(null); // Verificação de outro vendedor da mesma autopeça

      const mockAtendimento1 = {
        id: 1,
        solicitacao_id: 1,
        vendedor_id: 1,
        autopeca_id: 1,
        status_atendimento: "atendida",
        save: jest.fn().mockResolvedValue(true),
      };
      SolicitacoesAtendimento.create.mockResolvedValueOnce(mockAtendimento1);

      // Segundo vendedor da mesma autopeça tenta marcar
      Solicitacao.findOne.mockResolvedValueOnce({
        ...mockSolicitacao,
        cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
      });
      Vendedor.findOne.mockResolvedValueOnce(mockVendedor2);
      // Já existe atendimento de outro vendedor da mesma autopeça
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null) // Verificação do próprio vendedor
        .mockResolvedValueOnce({
          id: 1,
          solicitacao_id: 1,
          vendedor_id: 1,
          autopeca_id: 1,
          status_atendimento: "atendida",
        }); // Outro vendedor da mesma autopeça já atendeu

      const promise1 = VendedorOperacoesController.marcarComoAtendida(req1, res1);
      await new Promise((resolve) => setTimeout(resolve, 5));
      const promise2 = VendedorOperacoesController.marcarComoAtendida(req2, res2);

      await Promise.all([promise1, promise2]);

      // Apenas um deve conseguir
      expect(SolicitacoesAtendimento.create).toHaveBeenCalledTimes(1);
      expect(res2.status).toHaveBeenCalledWith(409);
    });
  });

  describe("⚡ Race Condition - Múltiplas Visualizações Simultâneas", () => {
    it("deve processar múltiplas marcações como vista simultaneamente", async () => {
      const solicitacaoId = "1";

      req1.params = { solicitacaoId: solicitacaoId };
      req2.params = { solicitacaoId: solicitacaoId };

      const mockSolicitacao = {
        id: 1,
        status_cliente: "ativa",
        cliente_id: 1,
        imagens: [],
      };

      const mockVendedor1 = {
        id: 1,
        autopeca_id: 1,
        usuario_id: 2,
        ativo: true,
      };

      const mockVendedor2 = {
        id: 2,
        autopeca_id: 2,
        usuario_id: 3,
        ativo: true,
      };

      // Ambos encontram a solicitação
      Solicitacao.findOne
        .mockResolvedValueOnce({
          ...mockSolicitacao,
          cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
        })
        .mockResolvedValueOnce({
          ...mockSolicitacao,
          cliente: { id: 1, nome_completo: "Cliente", celular: "11999999999" },
        });

      Vendedor.findOne
        .mockResolvedValueOnce({
          ...mockVendedor1,
          autopeca: {
            id: 1,
            endereco_cidade: "São Paulo",
            endereco_uf: "SP",
          },
        })
        .mockResolvedValueOnce({
          ...mockVendedor2,
          autopeca: {
            id: 2,
            endereco_cidade: "São Paulo",
            endereco_uf: "SP",
          },
        });

      // Nenhum ainda marcou como vista
      SolicitacoesAtendimento.findOne
        .mockResolvedValueOnce(null) // Primeiro vendedor - verificação
        .mockResolvedValueOnce(null) // Segundo vendedor - verificação
        .mockResolvedValueOnce(null) // Primeiro vendedor - verificação de atendida
        .mockResolvedValueOnce(null); // Segundo vendedor - verificação de atendida

      // Ambos criam registro de "lida" (o controller usa "lida" para "vista")
      const mockVista1 = {
        id: 1,
        solicitacao_id: 1,
        vendedor_id: 1,
        autopeca_id: 1,
        status_atendimento: "lida",
        data_marcacao: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };
      const mockVista2 = {
        id: 2,
        solicitacao_id: 1,
        vendedor_id: 2,
        autopeca_id: 2,
        status_atendimento: "lida",
        data_marcacao: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };
      SolicitacoesAtendimento.create
        .mockResolvedValueOnce(mockVista1)
        .mockResolvedValueOnce(mockVista2);

      // Executar simultaneamente
      const promise1 = VendedorOperacoesController.marcarComoVista(req1, res1);
      const promise2 = VendedorOperacoesController.marcarComoVista(req2, res2);

      await Promise.all([promise1, promise2]);

      // Ambos devem conseguir marcar como vista (comportamento esperado)
      expect(SolicitacoesAtendimento.create).toHaveBeenCalledTimes(2);
      expect(res1.status).toHaveBeenCalledWith(201);
      expect(res2.status).toHaveBeenCalledWith(201);
    });
  });
});

