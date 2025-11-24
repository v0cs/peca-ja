// Criar mocks ANTES de importar
const mockNotificacaoCreate = jest.fn();
const mockAutopecaFindByPk = jest.fn();
const mockVendedorFindAll = jest.fn();
const mockVendedorFindByPk = jest.fn();

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Notificacao: {
    create: mockNotificacaoCreate,
  },
  Autopeca: {
    findByPk: mockAutopecaFindByPk,
  },
  Usuario: jest.fn(),
  Vendedor: {
    findAll: mockVendedorFindAll,
    findByPk: mockVendedorFindByPk,
  },
}));

// Importar APÓS os mocks
const NotificationService = require("../../../src/services/notificationService");
const {
  Notificacao,
  Autopeca,
  Usuario,
  Vendedor,
} = require("../../../src/models");

describe("NotificationService", () => {
  beforeEach(() => {
    // Limpar apenas os mocks individuais
    mockNotificacaoCreate.mockClear();
    mockAutopecaFindByPk.mockClear();
    mockVendedorFindAll.mockClear();
    mockVendedorFindByPk.mockClear();
    // Mock console.log e console.error para não poluir os testes
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("criarNotificacao", () => {
    it("deve criar notificação com sucesso", async () => {
      // Arrange
      const mockNotificacao = {
        id: 1,
        usuario_id: "user123",
        tipo_notificacao: "nova_solicitacao",
        titulo: "Nova Solicitação",
        mensagem: "Você tem uma nova solicitação",
        metadados: { solicitacao_id: 1 },
        lida: false,
        enviada_email: false,
      };

      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result = await NotificationService.criarNotificacao(
        "user123",
        "nova_solicitacao",
        "Nova Solicitação",
        "Você tem uma nova solicitação",
        { solicitacao_id: 1 }
      );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledWith({
        usuario_id: "user123",
        tipo_notificacao: "nova_solicitacao",
        titulo: "Nova Solicitação",
        mensagem: "Você tem uma nova solicitação",
        metadados: { solicitacao_id: 1 },
        lida: false,
        enviada_email: false,
      });
      expect(result).toEqual(mockNotificacao);
    });

    it("deve criar notificação sem dados extra", async () => {
      // Arrange
      const mockNotificacao = {
        id: 1,
        usuario_id: "user123",
        tipo_notificacao: "teste",
        titulo: "Teste",
        mensagem: "Mensagem de teste",
        metadados: {},
        lida: false,
        enviada_email: false,
      };

      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result = await NotificationService.criarNotificacao(
        "user123",
        "teste",
        "Teste",
        "Mensagem de teste"
      );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledWith({
        usuario_id: "user123",
        tipo_notificacao: "teste",
        titulo: "Teste",
        mensagem: "Mensagem de teste",
        metadados: {},
        lida: false,
        enviada_email: false,
      });
      expect(result).toEqual(mockNotificacao);
    });

    it("deve retornar null quando ocorre erro", async () => {
      // Arrange
      Notificacao.create.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await NotificationService.criarNotificacao(
        "user123",
        "teste",
        "Teste",
        "Mensagem"
      );

      // Assert
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("notificarAutopecasNovaSolicitacao", () => {
    it("deve notificar múltiplas autopeças com sucesso", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };

      const autopecas = [
        { usuario_id: "user1" },
        { usuario_id: "user2" },
        { usuario_id: "user3" },
      ];

      const mockNotificacao1 = { id: 1, usuario_id: "user1" };
      const mockNotificacao2 = { id: 2, usuario_id: "user2" };
      const mockNotificacao3 = { id: 3, usuario_id: "user3" };

      Notificacao.create
        .mockResolvedValueOnce(mockNotificacao1)
        .mockResolvedValueOnce(mockNotificacao2)
        .mockResolvedValueOnce(mockNotificacao3);

      // Act
      const result =
        await NotificationService.notificarAutopecasNovaSolicitacao(
          solicitacao,
          autopecas
        );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
      expect(result).toContain(mockNotificacao1);
      expect(result).toContain(mockNotificacao2);
      expect(result).toContain(mockNotificacao3);
    });

    it("deve retornar array vazio quando não há autopeças", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };

      // Act
      const result =
        await NotificationService.notificarAutopecasNovaSolicitacao(
          solicitacao,
          []
        );

      // Assert
      expect(result).toEqual([]);
      expect(Notificacao.create).not.toHaveBeenCalled();
    });

    it("deve continuar mesmo quando uma notificação falha", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };

      const autopecas = [{ usuario_id: "user1" }, { usuario_id: "user2" }];

      const mockNotificacao1 = { id: 1, usuario_id: "user1" };

      Notificacao.create
        .mockResolvedValueOnce(mockNotificacao1)
        .mockResolvedValueOnce(null); // Segunda notificação retorna null

      // Act
      const result =
        await NotificationService.notificarAutopecasNovaSolicitacao(
          solicitacao,
          autopecas
        );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result).toContain(mockNotificacao1);
    });

    it("deve retornar array vazio quando ocorre erro", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      };

      const autopecas = [{ usuario_id: "user1" }];

      Notificacao.create.mockRejectedValue(new Error("Database error"));

      // Act
      const result =
        await NotificationService.notificarAutopecasNovaSolicitacao(
          solicitacao,
          autopecas
        );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("notificarClienteSolicitacaoAtendida", () => {
    it("deve notificar cliente com vendedor", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
      };

      const cliente = {
        usuario_id: "cliente123",
      };

      const autopeca = {
        id: 1,
        nome_fantasia: "Auto Peças Silva",
        razao_social: "Auto Peças Silva LTDA",
      };

      const vendedor = {
        id: 1,
        nome_completo: "João Vendedor",
      };

      const mockNotificacao = {
        id: 1,
        usuario_id: "cliente123",
        tipo_notificacao: "solicitacao_atendida",
      };

      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result =
        await NotificationService.notificarClienteSolicitacaoAtendida(
          solicitacao,
          cliente,
          autopeca,
          vendedor
        );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: "cliente123",
          tipo_notificacao: "solicitacao_atendida",
          titulo: "✅ Sua Solicitação Foi Atendida",
          mensagem: expect.stringContaining("João Vendedor"),
          metadados: expect.objectContaining({
            solicitacao_id: 1,
            vendedor_id: 1,
          }),
        })
      );
      expect(result).toEqual(mockNotificacao);
    });

    it("deve notificar cliente sem vendedor", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
      };

      const cliente = {
        usuario_id: "cliente123",
      };

      const autopeca = {
        id: 1,
        nome_fantasia: "Auto Peças Silva",
        razao_social: "Auto Peças Silva LTDA",
      };

      const mockNotificacao = {
        id: 1,
        usuario_id: "cliente123",
        tipo_notificacao: "solicitacao_atendida",
      };

      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result =
        await NotificationService.notificarClienteSolicitacaoAtendida(
          solicitacao,
          cliente,
          autopeca,
          null
        );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: "cliente123",
          tipo_notificacao: "solicitacao_atendida",
          mensagem: expect.not.stringContaining("vendedor"),
          metadados: expect.objectContaining({
            vendedor_id: null,
          }),
        })
      );
      expect(result).toEqual(mockNotificacao);
    });

    it("deve usar razao_social quando nome_fantasia não existe", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
      };

      const cliente = {
        usuario_id: "cliente123",
      };

      const autopeca = {
        id: 1,
        razao_social: "Auto Peças Silva LTDA",
      };

      const mockNotificacao = {
        id: 1,
        usuario_id: "cliente123",
      };

      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result =
        await NotificationService.notificarClienteSolicitacaoAtendida(
          solicitacao,
          cliente,
          autopeca,
          null
        );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mensagem: expect.stringContaining("Auto Peças Silva LTDA"),
        })
      );
    });

    it("deve retornar null quando ocorre erro", async () => {
      // Arrange
      const solicitacao = { id: 1, descricao_peca: "Teste" };
      const cliente = { usuario_id: "cliente123" };
      const autopeca = { id: 1, nome_fantasia: "Teste" };

      Notificacao.create.mockRejectedValue(new Error("Database error"));

      // Act
      const result =
        await NotificationService.notificarClienteSolicitacaoAtendida(
          solicitacao,
          cliente,
          autopeca,
          null
        );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("notificarAutopecaVendedorAtendeu", () => {
    it("deve notificar admin da autopeça com sucesso", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const vendedor = {
        id: 1,
        nome_completo: "João Vendedor",
      };

      const autopeca = {
        id: 1,
        usuario_id: "autopeca123",
      };

      const mockAutopecaCompleta = {
        id: 1,
        usuario_id: "autopeca123",
        usuario: {
          id: "autopeca123",
        },
      };

      const mockNotificacao = {
        id: 1,
        usuario_id: "autopeca123",
        tipo_notificacao: "vendedor_atendeu",
      };

      Autopeca.findByPk.mockResolvedValue(mockAutopecaCompleta);
      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result = await NotificationService.notificarAutopecaVendedorAtendeu(
        solicitacao,
        vendedor,
        autopeca
      );

      // Assert
      expect(Autopeca.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id"],
          },
        ],
      });
      expect(Notificacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: "autopeca123",
          tipo_notificacao: "vendedor_atendeu",
          titulo: "👤 Vendedor Atendeu Solicitação",
          metadados: expect.objectContaining({
            vendedor_id: 1,
            vendedor_nome: "João Vendedor",
          }),
        })
      );
      expect(result).toEqual(mockNotificacao);
    });

    it("deve retornar null quando autopeça não é encontrada", async () => {
      // Arrange
      const solicitacao = { id: 1, descricao_peca: "Teste" };
      const vendedor = { id: 1, nome_completo: "João" };
      const autopeca = { id: 1 };

      Autopeca.findByPk.mockResolvedValue(null);

      // Act
      const result = await NotificationService.notificarAutopecaVendedorAtendeu(
        solicitacao,
        vendedor,
        autopeca
      );

      // Assert
      expect(result).toBeNull();
      expect(Notificacao.create).not.toHaveBeenCalled();
    });

    it("deve retornar null quando autopeça não tem usuário", async () => {
      // Arrange
      const solicitacao = { id: 1, descricao_peca: "Teste" };
      const vendedor = { id: 1, nome_completo: "João" };
      const autopeca = { id: 1 };

      const mockAutopecaCompleta = {
        id: 1,
        usuario: null,
      };

      Autopeca.findByPk.mockResolvedValue(mockAutopecaCompleta);

      // Act
      const result = await NotificationService.notificarAutopecaVendedorAtendeu(
        solicitacao,
        vendedor,
        autopeca
      );

      // Assert
      expect(result).toBeNull();
      expect(Notificacao.create).not.toHaveBeenCalled();
    });

    it("deve retornar null quando ocorre erro", async () => {
      // Arrange
      const solicitacao = { id: 1, descricao_peca: "Teste" };
      const vendedor = { id: 1, nome_completo: "João" };
      const autopeca = { id: 1 };

      Autopeca.findByPk.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await NotificationService.notificarAutopecaVendedorAtendeu(
        solicitacao,
        vendedor,
        autopeca
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("notificarOutrosVendedoresPerderam", () => {
    it("deve notificar outros vendedores com sucesso", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const autopecaId = 1;
      const vendedorQueAtendeuId = 1;

      const outrosVendedores = [
        {
          id: 2,
          usuario_id: "vendedor2",
          usuario: { id: "vendedor2" },
        },
        {
          id: 3,
          usuario_id: "vendedor3",
          usuario: { id: "vendedor3" },
        },
      ];

      const mockNotificacao1 = { id: 1, usuario_id: "vendedor2" };
      const mockNotificacao2 = { id: 2, usuario_id: "vendedor3" };

      Vendedor.findAll.mockResolvedValue(outrosVendedores);
      Notificacao.create
        .mockResolvedValueOnce(mockNotificacao1)
        .mockResolvedValueOnce(mockNotificacao2);

      // Act
      const result =
        await NotificationService.notificarOutrosVendedoresPerderam(
          solicitacao,
          autopecaId,
          vendedorQueAtendeuId
        );

      // Assert
      expect(Vendedor.findAll).toHaveBeenCalledWith({
        where: {
          autopeca_id: 1,
          ativo: true,
        },
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id"],
            where: {
              ativo: true,
            },
          },
        ],
      });
      expect(Notificacao.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it("deve filtrar o vendedor que atendeu", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const autopecaId = 1;
      const vendedorQueAtendeuId = 1;

      const vendedores = [
        {
          id: 1, // Este é o que atendeu, deve ser filtrado
          usuario_id: "vendedor1",
          usuario: { id: "vendedor1" },
        },
        {
          id: 2,
          usuario_id: "vendedor2",
          usuario: { id: "vendedor2" },
        },
      ];

      const mockNotificacao = { id: 1, usuario_id: "vendedor2" };

      Vendedor.findAll.mockResolvedValue(vendedores);
      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result =
        await NotificationService.notificarOutrosVendedoresPerderam(
          solicitacao,
          autopecaId,
          vendedorQueAtendeuId
        );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it("deve retornar array vazio quando não há outros vendedores", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      Vendedor.findAll.mockResolvedValue([]);

      // Act
      const result =
        await NotificationService.notificarOutrosVendedoresPerderam(
          solicitacao,
          1,
          1
        );

      // Assert
      expect(result).toEqual([]);
      expect(Notificacao.create).not.toHaveBeenCalled();
    });

    it("deve retornar array vazio quando ocorre erro", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      Vendedor.findAll.mockRejectedValue(new Error("Database error"));

      // Act
      const result =
        await NotificationService.notificarOutrosVendedoresPerderam(
          solicitacao,
          1,
          1
        );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("notificarAutopecasSolicitacaoCancelada", () => {
    it("deve notificar autopeças e vendedores sobre cancelamento", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const atendimentos = [
        {
          autopeca_id: 1,
          vendedor_id: 1,
        },
        {
          autopeca_id: 2,
          vendedor_id: null,
        },
      ];

      const mockAutopeca1 = {
        id: 1,
        usuario_id: "autopeca1",
        usuario: { id: "autopeca1" },
      };

      const mockAutopeca2 = {
        id: 2,
        usuario_id: "autopeca2",
        usuario: { id: "autopeca2" },
      };

      const mockVendedor1 = {
        id: 1,
        usuario_id: "vendedor1",
        usuario: { id: "vendedor1" },
      };

      const mockNotificacao1 = { id: 1, usuario_id: "autopeca1" };
      const mockNotificacao2 = { id: 2, usuario_id: "autopeca2" };
      const mockNotificacao3 = { id: 3, usuario_id: "vendedor1" };

      Autopeca.findByPk
        .mockResolvedValueOnce(mockAutopeca1)
        .mockResolvedValueOnce(mockAutopeca2);
      Vendedor.findByPk.mockResolvedValue(mockVendedor1);
      Notificacao.create
        .mockResolvedValueOnce(mockNotificacao1)
        .mockResolvedValueOnce(mockNotificacao2)
        .mockResolvedValueOnce(mockNotificacao3);

      // Act
      const result =
        await NotificationService.notificarAutopecasSolicitacaoCancelada(
          solicitacao,
          atendimentos
        );

      // Assert
      expect(Autopeca.findByPk).toHaveBeenCalledTimes(2);
      expect(Vendedor.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id"],
          },
        ],
      });
      expect(Notificacao.create).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it("deve ignorar autopeça sem usuário", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const atendimentos = [
        {
          autopeca_id: 1,
          vendedor_id: null,
        },
      ];

      const mockAutopeca = {
        id: 1,
        usuario: null, // Sem usuário
      };

      Autopeca.findByPk.mockResolvedValue(mockAutopeca);

      // Act
      const result =
        await NotificationService.notificarAutopecasSolicitacaoCancelada(
          solicitacao,
          atendimentos
        );

      // Assert
      expect(Notificacao.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("deve ignorar vendedor sem usuário", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const atendimentos = [
        {
          autopeca_id: 1,
          vendedor_id: 1,
        },
      ];

      const mockAutopeca = {
        id: 1,
        usuario_id: "autopeca1",
        usuario: { id: "autopeca1" },
      };

      const mockVendedor = {
        id: 1,
        usuario: null, // Sem usuário
      };

      const mockNotificacao = { id: 1, usuario_id: "autopeca1" };

      Autopeca.findByPk.mockResolvedValue(mockAutopeca);
      Vendedor.findByPk.mockResolvedValue(mockVendedor);
      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result =
        await NotificationService.notificarAutopecasSolicitacaoCancelada(
          solicitacao,
          atendimentos
        );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledTimes(1); // Apenas para autopeça
      expect(result).toHaveLength(1);
    });

    it("deve retornar array vazio quando ocorre erro", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const atendimentos = [
        {
          autopeca_id: 1,
          vendedor_id: null,
        },
      ];

      Autopeca.findByPk.mockRejectedValue(new Error("Database error"));

      // Act
      const result =
        await NotificationService.notificarAutopecasSolicitacaoCancelada(
          solicitacao,
          atendimentos
        );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("notificarClienteSolicitacaoCancelada", () => {
    it("deve notificar cliente sobre cancelamento com sucesso", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const cliente = {
        usuario_id: "cliente123",
      };

      const mockNotificacao = {
        id: 1,
        usuario_id: "cliente123",
        tipo_notificacao: "solicitacao_cancelada",
      };

      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result =
        await NotificationService.notificarClienteSolicitacaoCancelada(
          solicitacao,
          cliente
        );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: "cliente123",
          tipo_notificacao: "solicitacao_cancelada",
          titulo: "✅ Solicitação Cancelada com Sucesso",
          metadados: expect.objectContaining({
            solicitacao_id: 1,
            descricao_peca: "Pastilha de freio",
          }),
        })
      );
      expect(result).toEqual(mockNotificacao);
    });

    it("deve retornar null quando ocorre erro", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
        marca: "Volkswagen",
        modelo: "Golf",
      };

      const cliente = {
        usuario_id: "cliente123",
      };

      Notificacao.create.mockRejectedValue(new Error("Database error"));

      // Act
      const result =
        await NotificationService.notificarClienteSolicitacaoCancelada(
          solicitacao,
          cliente
        );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("notificarConflitoAtendimento", () => {
    it("deve notificar admin sobre conflito com sucesso", async () => {
      // Arrange
      const solicitacao = {
        id: 1,
        descricao_peca: "Pastilha de freio",
      };

      const autopeca = {
        id: 1,
        usuario_id: "autopeca123",
      };

      const mockAutopecaCompleta = {
        id: 1,
        usuario_id: "autopeca123",
        usuario: {
          id: "autopeca123",
        },
      };

      const mockNotificacao = {
        id: 1,
        usuario_id: "autopeca123",
        tipo_notificacao: "conflito_atendimento",
      };

      Autopeca.findByPk.mockResolvedValue(mockAutopecaCompleta);
      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result = await NotificationService.notificarConflitoAtendimento(
        solicitacao,
        autopeca
      );

      // Assert
      expect(Autopeca.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id"],
          },
        ],
      });
      expect(Notificacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: "autopeca123",
          tipo_notificacao: "conflito_atendimento",
          titulo: "⚠️ Conflito de Atendimento Detectado",
          metadados: expect.objectContaining({
            solicitacao_id: 1,
            autopeca_id: 1,
          }),
        })
      );
      expect(result).toEqual(mockNotificacao);
    });

    it("deve retornar null quando autopeça não é encontrada", async () => {
      // Arrange
      const solicitacao = { id: 1, descricao_peca: "Teste" };
      const autopeca = { id: 1 };

      Autopeca.findByPk.mockResolvedValue(null);

      // Act
      const result = await NotificationService.notificarConflitoAtendimento(
        solicitacao,
        autopeca
      );

      // Assert
      expect(result).toBeNull();
      expect(Notificacao.create).not.toHaveBeenCalled();
    });

    it("deve retornar null quando autopeça não tem usuário", async () => {
      // Arrange
      const solicitacao = { id: 1, descricao_peca: "Teste" };
      const autopeca = { id: 1 };

      const mockAutopecaCompleta = {
        id: 1,
        usuario: null,
      };

      Autopeca.findByPk.mockResolvedValue(mockAutopecaCompleta);

      // Act
      const result = await NotificationService.notificarConflitoAtendimento(
        solicitacao,
        autopeca
      );

      // Assert
      expect(result).toBeNull();
      expect(Notificacao.create).not.toHaveBeenCalled();
    });

    it("deve retornar null quando ocorre erro", async () => {
      // Arrange
      const solicitacao = { id: 1, descricao_peca: "Teste" };
      const autopeca = { id: 1 };

      Autopeca.findByPk.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await NotificationService.notificarConflitoAtendimento(
        solicitacao,
        autopeca
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("criarNotificacao - edge cases", () => {
    it("deve tratar usuarioId vazio corretamente", async () => {
      // Arrange
      Notificacao.create.mockRejectedValue(
        new Error("usuario_id cannot be null")
      );

      // Act
      const result = await NotificationService.criarNotificacao(
        "",
        "nova_solicitacao",
        "Título",
        "Mensagem"
      );

      // Assert
      expect(result).toBeNull();
    });

    it("deve tratar usuarioId undefined corretamente", async () => {
      // Arrange
      Notificacao.create.mockRejectedValue(
        new Error("usuario_id cannot be null")
      );

      // Act
      const result = await NotificationService.criarNotificacao(
        undefined,
        "nova_solicitacao",
        "Título",
        "Mensagem"
      );

      // Assert
      expect(result).toBeNull();
    });

    it("deve tratar dadosExtra como null corretamente", async () => {
      // Arrange
      const mockNotificacao = {
        id: 1,
        usuario_id: "user123",
        tipo_notificacao: "nova_solicitacao",
        titulo: "Título",
        mensagem: "Mensagem",
        metadados: null,
        lida: false,
        enviada_email: false,
      };

      Notificacao.create.mockResolvedValue(mockNotificacao);

      // Act
      const result = await NotificationService.criarNotificacao(
        "user123",
        "nova_solicitacao",
        "Título",
        "Mensagem",
        null
      );

      // Assert
      expect(Notificacao.create).toHaveBeenCalledWith({
        usuario_id: "user123",
        tipo_notificacao: "nova_solicitacao",
        titulo: "Título",
        mensagem: "Mensagem",
        metadados: null,
        lida: false,
        enviada_email: false,
      });
      expect(result).toEqual(mockNotificacao);
    });
  });
});
