const { setupTransactionMock } = require("../../helpers/mockFactory");

// Mock dos modelos - DEVE ser definido antes de importar o controller
jest.mock("../../../src/models", () => {
  const createModelMock = (additionalMethods = {}) => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    bulkCreate: jest.fn(),
    sequelize: {
      transaction: jest.fn(),
    },
    ...additionalMethods,
  });

  return {
    Solicitacao: createModelMock(),
    Cliente: createModelMock(),
    Usuario: createModelMock(),
    Autopeca: createModelMock(),
    Vendedor: createModelMock(),
    ImagemSolicitacao: createModelMock(),
    SolicitacoesAtendimento: createModelMock(),
    sequelize: {
      transaction: jest.fn(),
    },
  };
});

jest.mock("../../../src/services", () => ({
  emailService: {
    sendEmail: jest.fn(),
    sendNewRequestNotification: jest.fn(),
  },
}));

jest.mock("../../../src/services/notificationService", () => ({
  createNotification: jest.fn(),
  notificarAutopecasNovaSolicitacao: jest.fn(),
}));

// Importar os mocks após a definição do jest.mock
const SolicitacaoController = require("../../../src/controllers/solicitacaoController");
const { Solicitacao, Cliente } = require("../../../src/models");

describe("SolicitacaoController - Testes Simples", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    // Limpar mocks individuais
    Solicitacao.findOne.mockClear();
    Solicitacao.findAll.mockClear();
    Cliente.findOne.mockClear();
    
    // Reconfigurar transaction
    mockTransaction = setupTransactionMock(Solicitacao);
    
    req = {
      user: { userId: 1, tipo: "cliente" },
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("create", () => {
    it("deve retornar erro quando usuário não é cliente", async () => {
      req.user.tipo = "autopeca";
      req.body = { descricao_peca: "Teste" };

      await SolicitacaoController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Apenas clientes podem criar solicitações",
        })
      );
    });

    it("deve retornar erro quando cliente não é encontrado", async () => {
      req.body = { descricao_peca: "Teste" };
      Cliente.findOne.mockResolvedValue(null);

      await SolicitacaoController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Cliente não encontrado",
        })
      );
    });
  });

  describe("getById", () => {
    it("deve retornar erro quando cliente não é encontrado", async () => {
      req.params.id = "999";
      Cliente.findOne.mockResolvedValue(null);

      await SolicitacaoController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Cliente não encontrado",
        })
      );
    });
  });
});
