const { createModelMock } = require("../../helpers/mockFactory");

// Criar mock do model ANTES de tudo
const mockNotificacao = createModelMock({
  sequelize: {
    fn: jest.fn((fn, col) => ({ fn, col })),
    col: jest.fn((col) => col),
  },
});

// Mock dos models
jest.mock("../../../src/models", () => ({
  Notificacao: mockNotificacao,
}));

// Importar APÓS os mocks
const NotificationController = require("../../../src/controllers/notificationController");
const { Notificacao } = require("../../../src/models");

describe("NotificationController - Testes Simples", () => {
  let req, res;

  beforeEach(() => {
    // Limpar mocks individuais
    Notificacao.findAndCountAll.mockClear();
    Notificacao.findOne.mockClear();
    Notificacao.findAll.mockClear();
    Notificacao.update.mockClear();
    Notificacao.destroy.mockClear();
    Notificacao.count.mockClear();
    
    req = {
      user: { userId: 1 },
      query: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("listarNotificacoes", () => {
    it("deve listar notificações com sucesso", async () => {
      const mockNotificacoes = {
        count: 2,
        rows: [
          { id: 1, mensagem: "Notificação 1", lida: false },
          { id: 2, mensagem: "Notificação 2", lida: true },
        ],
      };

      Notificacao.findAndCountAll.mockResolvedValue(mockNotificacoes);

      await NotificationController.listarNotificacoes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Notificações listadas com sucesso",
        })
      );
    });

    it("deve aplicar filtro de tipo quando fornecido", async () => {
      req.query.tipo = "nova_solicitacao";
      const mockNotificacoes = {
        count: 1,
        rows: [{ id: 1, mensagem: "Nova solicitação", lida: false }],
      };

      Notificacao.findAndCountAll.mockResolvedValue(mockNotificacoes);

      await NotificationController.listarNotificacoes(req, res);

      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo_notificacao: "nova_solicitacao",
          }),
        })
      );
    });
  });

  describe("marcarComoLida", () => {
    it("deve retornar erro quando notificação não é encontrada", async () => {
      req.params.id = "1";
      Notificacao.findOne.mockResolvedValue(null);

      await NotificationController.marcarComoLida(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Notificação não encontrada",
        })
      );
    });

    it("deve marcar notificação como lida com sucesso", async () => {
      req.params.id = "1";
      const mockNotificacao = {
        id: 1,
        usuario_id: 1,
        lida: false,
        update: jest.fn().mockResolvedValue({ lida: true }),
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      await NotificationController.marcarComoLida(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe("contarNaoLidas", () => {
    it("deve retornar contagem de notificações não lidas", async () => {
      Notificacao.count.mockResolvedValue(5);
      Notificacao.findAll.mockResolvedValue([]);

      await NotificationController.contarNaoLidas(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total_nao_lidas: 5,
          }),
        })
      );
    });
  });
});

