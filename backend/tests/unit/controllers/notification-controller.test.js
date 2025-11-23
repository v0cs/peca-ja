const NotificationController = require("../../../src/controllers/notificationController");
const { Notificacao } = require("../../../src/models");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Notificacao: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
    sequelize: {
      fn: jest.fn((fn, col) => ({ fn, col })),
      col: jest.fn((col) => col),
    },
  },
}));

describe("NotificationController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        userId: 1,
        tipo: "cliente",
      },
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("listarNotificacoes", () => {
    it("deve listar notificações com sucesso", async () => {
      // Arrange
      const mockNotificacoes = [
        {
          id: 1,
          tipo_notificacao: "nova_solicitacao",
          lida: false,
          data_criacao: new Date(),
        },
        {
          id: 2,
          tipo_notificacao: "solicitacao_atendida",
          lida: true,
          data_criacao: new Date(),
        },
      ];

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockNotificacoes,
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Notificações listadas com sucesso",
        data: expect.objectContaining({
          notificacoes: mockNotificacoes,
          paginacao: expect.objectContaining({
            total: 2,
            pagina_atual: 1,
            total_paginas: 1,
            limite_por_pagina: 20,
            tem_proxima: false,
            tem_anterior: false,
          }),
        }),
      });
    });

    it("deve aplicar filtro de tipo", async () => {
      // Arrange
      req.query.tipo = "nova_solicitacao";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          tipo_notificacao: "nova_solicitacao",
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
    });

    it("deve aplicar filtro de lida=true", async () => {
      // Arrange
      req.query.lida = "true";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          lida: true,
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
    });

    it("deve aplicar filtro de lida=false", async () => {
      // Arrange
      req.query.lida = "false";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          lida: false,
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
    });

    it("deve aplicar filtros combinados de tipo e lida", async () => {
      // Arrange
      req.query.tipo = "nova_solicitacao";
      req.query.lida = "false";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          tipo_notificacao: "nova_solicitacao",
          lida: false,
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
    });

    it("deve tratar página inválida como página 1", async () => {
      // Arrange
      req.query.page = "invalid";
      req.query.limit = "10";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
        },
        order: [["data_criacao", "DESC"]],
        limit: 10,
        offset: 0,
      });
    });

    it("deve tratar limite inválido como limite padrão 20", async () => {
      // Arrange
      req.query.page = "1";
      req.query.limit = "invalid";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
    });

    it("deve calcular paginação corretamente na última página", async () => {
      // Arrange
      req.query.page = "3";
      req.query.limit = "10";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paginacao: expect.objectContaining({
              pagina_atual: 3,
              total_paginas: 3,
              tem_proxima: false,
              tem_anterior: true,
            }),
          }),
        })
      );
    });

    it("deve aplicar paginação corretamente", async () => {
      // Arrange
      req.query.page = "2";
      req.query.limit = "10";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
        },
        order: [["data_criacao", "DESC"]],
        limit: 10,
        offset: 10,
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paginacao: expect.objectContaining({
              pagina_atual: 2,
              total_paginas: 3,
              limite_por_pagina: 10,
              tem_proxima: true,
              tem_anterior: true,
            }),
          }),
        })
      );
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      Notificacao.findAndCountAll.mockRejectedValue(
        new Error("Database error")
      );

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Erro ao processar solicitação",
        },
      });
    });
  });

  describe("marcarComoLida", () => {
    it("deve marcar notificação como lida com sucesso", async () => {
      // Arrange
      req.params.id = "1";
      const mockNotificacao = {
        id: 1,
        lida: false,
        update: jest.fn().mockResolvedValue(true),
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      // Act
      await NotificationController.marcarComoLida(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "1",
          usuario_id: 1,
        },
      });
      expect(mockNotificacao.update).toHaveBeenCalledWith({ lida: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Notificação marcada como lida",
        data: {
          notificacao: mockNotificacao,
        },
      });
    });

    it("deve retornar sucesso quando notificação já está lida", async () => {
      // Arrange
      req.params.id = "1";
      const mockNotificacao = {
        id: 1,
        lida: true,
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      // Act
      await NotificationController.marcarComoLida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Notificação já estava marcada como lida",
        data: {
          notificacao: mockNotificacao,
        },
      });
    });

    it("deve remover ':' do início do ID se existir", async () => {
      // Arrange
      req.params.id = ":1";
      const mockNotificacao = {
        id: 1,
        lida: false,
        update: jest.fn().mockResolvedValue(true),
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      // Act
      await NotificationController.marcarComoLida(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "1",
          usuario_id: 1,
        },
      });
    });

    it("não deve remover ':' se não estiver no início do ID", async () => {
      // Arrange
      req.params.id = "1:2";
      const mockNotificacao = {
        id: 1,
        lida: false,
        update: jest.fn().mockResolvedValue(true),
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      // Act
      await NotificationController.marcarComoLida(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "1:2",
          usuario_id: 1,
        },
      });
    });

    it("deve retornar erro 404 quando notificação não é encontrada", async () => {
      // Arrange
      req.params.id = "999";
      Notificacao.findOne.mockResolvedValue(null);

      // Act
      await NotificationController.marcarComoLida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Notificação não encontrada",
        errors: {
          notificacao: "Notificação não existe ou não pertence a este usuário",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.params.id = "1";
      Notificacao.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await NotificationController.marcarComoLida(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("marcarTodasComoLidas", () => {
    it("deve marcar todas as notificações como lidas com sucesso", async () => {
      // Arrange
      Notificacao.update.mockResolvedValue([5]); // [quantidadeAtualizada]

      // Act
      await NotificationController.marcarTodasComoLidas(req, res);

      // Assert
      expect(Notificacao.update).toHaveBeenCalledWith(
        { lida: true },
        {
          where: {
            usuario_id: 1,
            lida: false,
          },
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "5 notificação(ões) marcada(s) como lida(s)",
        data: {
          quantidade_atualizada: 5,
        },
      });
    });

    it("deve retornar 0 quando não há notificações para marcar", async () => {
      // Arrange
      Notificacao.update.mockResolvedValue([0]);

      // Act
      await NotificationController.marcarTodasComoLidas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "0 notificação(ões) marcada(s) como lida(s)",
        data: {
          quantidade_atualizada: 0,
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      Notificacao.update.mockRejectedValue(new Error("Database error"));

      // Act
      await NotificationController.marcarTodasComoLidas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("contarNaoLidas", () => {
    it("deve contar notificações não lidas com sucesso", async () => {
      // Arrange
      Notificacao.count.mockResolvedValue(3);
      Notificacao.findAll.mockResolvedValue([
        { tipo_notificacao: "nova_solicitacao", total: "2" },
        { tipo_notificacao: "solicitacao_atendida", total: "1" },
      ]);

      // Act
      await NotificationController.contarNaoLidas(req, res);

      // Assert
      expect(Notificacao.count).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          lida: false,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Contagem de notificações não lidas",
        data: {
          total_nao_lidas: 3,
          por_tipo: {
            nova_solicitacao: 2,
            solicitacao_atendida: 1,
          },
        },
      });
    });

    it("deve retornar 0 quando não há notificações não lidas", async () => {
      // Arrange
      Notificacao.count.mockResolvedValue(0);
      Notificacao.findAll.mockResolvedValue([]);

      // Act
      await NotificationController.contarNaoLidas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Contagem de notificações não lidas",
        data: {
          total_nao_lidas: 0,
          por_tipo: {},
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro no count", async () => {
      // Arrange
      Notificacao.count.mockRejectedValue(new Error("Database error"));

      // Act
      await NotificationController.contarNaoLidas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("deve retornar erro 500 quando ocorre erro no findAll", async () => {
      // Arrange
      Notificacao.count.mockResolvedValue(3);
      Notificacao.findAll.mockRejectedValue(new Error("Database error"));

      // Act
      await NotificationController.contarNaoLidas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("deve formatar contagem por tipo corretamente", async () => {
      // Arrange
      Notificacao.count.mockResolvedValue(5);
      Notificacao.findAll.mockResolvedValue([
        { tipo_notificacao: "nova_solicitacao", total: "3" },
        { tipo_notificacao: "solicitacao_atendida", total: "2" },
      ]);

      // Act
      await NotificationController.contarNaoLidas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Contagem de notificações não lidas",
        data: {
          total_nao_lidas: 5,
          por_tipo: {
            nova_solicitacao: 3,
            solicitacao_atendida: 2,
          },
        },
      });
    });

    it("deve tratar contagem por tipo quando findAll retorna vazio", async () => {
      // Arrange
      Notificacao.count.mockResolvedValue(0);
      Notificacao.findAll.mockResolvedValue([]);

      // Act
      await NotificationController.contarNaoLidas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Contagem de notificações não lidas",
        data: {
          total_nao_lidas: 0,
          por_tipo: {},
        },
      });
    });
  });

  describe("deletarNotificacao", () => {
    it("deve deletar notificação com sucesso", async () => {
      // Arrange
      req.params.id = "1";
      const mockNotificacao = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      // Act
      await NotificationController.deletarNotificacao(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "1",
          usuario_id: 1,
        },
      });
      expect(mockNotificacao.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Notificação deletada com sucesso",
        data: {
          notificacao_id: "1",
        },
      });
    });

    it("deve retornar erro 404 quando notificação não é encontrada", async () => {
      // Arrange
      req.params.id = "999";
      Notificacao.findOne.mockResolvedValue(null);

      // Act
      await NotificationController.deletarNotificacao(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("deve remover ':' do início do ID ao deletar", async () => {
      // Arrange
      req.params.id = ":1";
      const mockNotificacao = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      // Act
      await NotificationController.deletarNotificacao(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "1",
          usuario_id: 1,
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.params.id = "1";
      Notificacao.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await NotificationController.deletarNotificacao(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deletarTodasLidas", () => {
    it("deve deletar todas as notificações lidas com sucesso", async () => {
      // Arrange
      Notificacao.destroy.mockResolvedValue(10);

      // Act
      await NotificationController.deletarTodasLidas(req, res);

      // Assert
      expect(Notificacao.destroy).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          lida: true,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "10 notificação(ões) deletada(s)",
        data: {
          quantidade_deletada: 10,
        },
      });
    });

    it("deve retornar 0 quando não há notificações lidas", async () => {
      // Arrange
      Notificacao.destroy.mockResolvedValue(0);

      // Act
      await NotificationController.deletarTodasLidas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "0 notificação(ões) deletada(s)",
        data: {
          quantidade_deletada: 0,
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      Notificacao.destroy.mockRejectedValue(new Error("Database error"));

      // Act
      await NotificationController.deletarTodasLidas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("buscarPorId", () => {
    it("deve buscar notificação por ID com sucesso", async () => {
      // Arrange
      req.params.id = "1";
      const mockNotificacao = {
        id: 1,
        tipo_notificacao: "nova_solicitacao",
        lida: false,
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      // Act
      await NotificationController.buscarPorId(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "1",
          usuario_id: 1,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Notificação encontrada",
        data: {
          notificacao: mockNotificacao,
        },
      });
    });

    it("deve retornar erro 404 quando notificação não é encontrada", async () => {
      // Arrange
      req.params.id = "999";
      Notificacao.findOne.mockResolvedValue(null);

      // Act
      await NotificationController.buscarPorId(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("deve remover ':' do início do ID ao buscar", async () => {
      // Arrange
      req.params.id = ":1";
      const mockNotificacao = {
        id: 1,
        tipo_notificacao: "nova_solicitacao",
        lida: false,
      };

      Notificacao.findOne.mockResolvedValue(mockNotificacao);

      // Act
      await NotificationController.buscarPorId(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "1",
          usuario_id: 1,
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.params.id = "1";
      Notificacao.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await NotificationController.buscarPorId(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("deve tratar ID vazio corretamente", async () => {
      // Arrange
      req.params.id = "";
      Notificacao.findOne.mockResolvedValue(null);

      // Act
      await NotificationController.buscarPorId(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "",
          usuario_id: 1,
        },
      });
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("listarNotificacoes - edge cases", () => {
    it("deve tratar página 0 como página 1", async () => {
      // Arrange
      req.query.page = "0";
      req.query.limit = "10";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
        },
        order: [["data_criacao", "DESC"]],
        limit: 10,
        offset: 0,
      });
    });

    it("deve tratar limite 0 como limite padrão 20", async () => {
      // Arrange
      req.query.page = "1";
      req.query.limit = "0";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
    });

    it("deve tratar lida como string 'false' corretamente", async () => {
      // Arrange
      req.query.lida = "false";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          lida: false,
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
    });

    it("deve tratar lida como string 'true' corretamente", async () => {
      // Arrange
      req.query.lida = "true";

      Notificacao.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [],
      });

      // Act
      await NotificationController.listarNotificacoes(req, res);

      // Assert
      expect(Notificacao.findAndCountAll).toHaveBeenCalledWith({
        where: {
          usuario_id: 1,
          lida: true,
        },
        order: [["data_criacao", "DESC"]],
        limit: 20,
        offset: 0,
      });
    });
  });

  describe("marcarComoLida - edge cases", () => {
    it("deve tratar ID vazio corretamente", async () => {
      // Arrange
      req.params.id = "";
      Notificacao.findOne.mockResolvedValue(null);

      // Act
      await NotificationController.marcarComoLida(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "",
          usuario_id: 1,
        },
      });
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deletarNotificacao - edge cases", () => {
    it("deve tratar ID vazio corretamente", async () => {
      // Arrange
      req.params.id = "";
      Notificacao.findOne.mockResolvedValue(null);

      // Act
      await NotificationController.deletarNotificacao(req, res);

      // Assert
      expect(Notificacao.findOne).toHaveBeenCalledWith({
        where: {
          id: "",
          usuario_id: 1,
        },
      });
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("contarNaoLidas - edge cases", () => {
    it("deve tratar contagem por tipo quando total é string numérica", async () => {
      // Arrange
      Notificacao.count.mockResolvedValue(3);
      Notificacao.findAll.mockResolvedValue([
        { tipo_notificacao: "nova_solicitacao", total: "2" },
        { tipo_notificacao: "solicitacao_atendida", total: "1" },
      ]);

      // Act
      await NotificationController.contarNaoLidas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Contagem de notificações não lidas",
        data: {
          total_nao_lidas: 3,
          por_tipo: {
            nova_solicitacao: 2,
            solicitacao_atendida: 1,
          },
        },
      });
    });

    it("deve tratar contagem por tipo quando total é número", async () => {
      // Arrange
      Notificacao.count.mockResolvedValue(3);
      Notificacao.findAll.mockResolvedValue([
        { tipo_notificacao: "nova_solicitacao", total: 2 },
        { tipo_notificacao: "solicitacao_atendida", total: 1 },
      ]);

      // Act
      await NotificationController.contarNaoLidas(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Contagem de notificações não lidas",
        data: {
          total_nao_lidas: 3,
          por_tipo: {
            nova_solicitacao: 2,
            solicitacao_atendida: 1,
          },
        },
      });
    });
  });
});
