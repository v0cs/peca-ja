const SolicitacaoController = require("../../../src/controllers/solicitacaoController");
const { Solicitacao, Cliente } = require("../../../src/models");

jest.mock("../../../src/models", () => ({
  Solicitacao: {
    sequelize: {
      transaction: jest.fn(),
    },
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  Cliente: {
    findOne: jest.fn(),
  },
  Usuario: {},
}));

jest.mock("../../../src/services", () => ({
  emailService: {
    sendEmail: jest.fn(),
  },
}));

jest.mock("../../../src/services/notificationService", () => ({
  createNotification: jest.fn(),
}));

describe("SolicitacaoController - Testes Simples", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
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
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    Solicitacao.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
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
