const {
  consultaVeicularMiddleware,
  consultaVeicularSolicitacoesMiddleware,
  logConsultaVeicularMiddleware,
} = require("../../../src/middleware/consultaVeicularMiddleware");
const { apiVeicularService } = require("../../../src/services");

// Mock do apiVeicularService
jest.mock("../../../src/services", () => ({
  apiVeicularService: {
    consultarVeiculoPorPlaca: jest.fn(),
  },
}));

describe("consultaVeicularMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    // Limpar apenas os mocks de console, não os mocks de serviços
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Limpar apenas o mock do apiVeicularService
    apiVeicularService.consultarVeiculoPorPlaca.mockClear();

    req = {
      method: "POST",
      body: {},
      ip: "192.168.1.1",
      connection: { remoteAddress: "192.168.1.1" },
      socket: { remoteAddress: "192.168.1.1" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn(),
    };

    next = jest.fn();
  });

  describe("comportamento básico", () => {
    it("deve ignorar requisições que não são POST", async () => {
      // Arrange
      req.method = "GET";

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(
        apiVeicularService.consultarVeiculoPorPlaca
      ).not.toHaveBeenCalled();
      expect(req.body.origem_dados_veiculo).toBeUndefined();
    });

    it("deve continuar com dados manuais quando não há placa", async () => {
      // Arrange
      req.body = { marca: "Fiat", modelo: "Uno" };

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(
        apiVeicularService.consultarVeiculoPorPlaca
      ).not.toHaveBeenCalled();
      expect(req.body.origem_dados_veiculo).toBe("manual");
    });

    it("deve continuar com dados manuais quando placa é string vazia", async () => {
      // Arrange
      req.body = { placa: "   " };

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(
        apiVeicularService.consultarVeiculoPorPlaca
      ).not.toHaveBeenCalled();
      expect(req.body.origem_dados_veiculo).toBe("manual");
    });

    it("deve continuar com dados manuais quando placa não é string", async () => {
      // Arrange
      req.body = { placa: 123 };

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(
        apiVeicularService.consultarVeiculoPorPlaca
      ).not.toHaveBeenCalled();
      expect(req.body.origem_dados_veiculo).toBe("manual");
    });
  });

  describe("consulta bem-sucedida", () => {
    it("deve mesclar dados da API com sucesso", async () => {
      // Arrange
      const placa = "ABC1234";
      const dadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        modelo: "Uno",
        ano_fabricacao: 2020,
        ano_modelo: 2021,
        categoria: "Passeio",
        cor: "Branco",
        chassi: "123456789",
        renavam: "987654321",
        origem_dados: "api",
        origem_dados_veiculo: "api",
        api_veicular_metadata: { consultado: true },
      };

      req.body = { placa, descricao: "Preciso de peças" };
      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        dadosVeiculo
      );

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        placa,
        "192.168.1.1"
      );
      expect(req.body.placa).toBe("ABC1234");
      expect(req.body.marca).toBe("Fiat");
      expect(req.body.modelo).toBe("Uno");
      expect(req.body.ano_fabricacao).toBe(2020);
      expect(req.body.ano_modelo).toBe(2021);
      expect(req.body.categoria).toBe("Passeio");
      expect(req.body.cor).toBe("Branco");
      expect(req.body.chassi).toBe("123456789");
      expect(req.body.renavam).toBe("987654321");
      expect(req.body.origem_dados_veiculo).toBe("api");
      expect(req.body.api_veicular_metadata).toEqual({ consultado: true });
      expect(req.body.descricao).toBe("Preciso de peças"); // Dados originais preservados
      expect(req.apiVeicularInfo).toEqual({
        consultado: true,
        origem: "api",
        placa: "ABC1234",
        timestamp: expect.any(String),
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("deve usar IP do req.ip quando disponível", async () => {
      // Arrange
      req.ip = "10.0.0.1";
      req.body = { placa: "ABC1234" };
      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
        origem_dados: "api",
        placa: "ABC1234",
      });

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "10.0.0.1"
      );
    });

    it("deve usar IP do req.connection.remoteAddress como fallback", async () => {
      // Arrange
      delete req.ip;
      req.connection.remoteAddress = "172.16.0.1";
      req.body = { placa: "ABC1234" };
      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
        origem_dados: "api",
        placa: "ABC1234",
      });

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "172.16.0.1"
      );
    });

    it("deve usar IP do req.socket.remoteAddress como segundo fallback", async () => {
      // Arrange
      req.ip = undefined;
      req.connection = { remoteAddress: undefined }; // Objeto existe mas remoteAddress é undefined
      req.socket = { remoteAddress: "192.168.0.1" };
      req.body = { placa: "ABC1234" };
      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
        origem_dados: "api",
        placa: "ABC1234",
      });

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "192.168.0.1"
      );
    });

    it("deve usar IP padrão 127.0.0.1 quando nenhum IP está disponível", async () => {
      // Arrange
      req.ip = undefined;
      req.connection = { remoteAddress: undefined }; // Objeto existe mas remoteAddress é undefined
      req.socket = { remoteAddress: undefined }; // Objeto existe mas remoteAddress é undefined
      req.body = { placa: "ABC1234" };
      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
        origem_dados: "api",
        placa: "ABC1234",
      });

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "127.0.0.1"
      );
    });
  });

  describe("dados inválidos da API", () => {
    it("deve usar dados manuais quando API retorna dados sem origem_dados", async () => {
      // Arrange
      req.body = { placa: "ABC1234", descricao: "Preciso de peças" };
      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
        placa: "ABC1234",
        // Sem origem_dados
      });

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(req.body.origem_dados_veiculo).toBe("manual");
      expect(req.body.descricao).toBe("Preciso de peças"); // Dados originais preservados
      expect(req.apiVeicularInfo).toEqual({
        consultado: true,
        origem: "manual",
        motivo: "dados_invalidos",
        placa: "ABC1234",
        timestamp: expect.any(String),
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("deve usar dados manuais quando API retorna null", async () => {
      // Arrange
      req.body = { placa: "ABC1234" };
      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(null);

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(req.body.origem_dados_veiculo).toBe("manual");
      expect(req.apiVeicularInfo.motivo).toBe("dados_invalidos");
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("tratamento de erros", () => {
    beforeEach(() => {
      // Garantir que connection e socket sempre existam como objetos
      // Isso é necessário porque o código não usa optional chaining
      // O req já é criado no beforeEach do describe principal, mas garantimos aqui também
      // IMPORTANTE: Garantir que são objetos, não undefined
      if (!req.connection || typeof req.connection !== "object") {
        req.connection = { remoteAddress: undefined };
      }
      if (!req.socket || typeof req.socket !== "object") {
        req.socket = { remoteAddress: undefined };
      }
      // Garantir que req.ip está definido
      if (!req.ip) {
        req.ip = "192.168.1.1";
      }
      // Limpar mocks do apiVeicularService
      apiVeicularService.consultarVeiculoPorPlaca.mockClear();
    });

    it("deve retornar erro 429 quando rate limit é excedido", async () => {
      // Arrange
      // Garantir que req está configurado corretamente
      req.body = { placa: "ABC1234" };
      req.ip = "192.168.1.1";
      // Garantir que connection e socket são objetos válidos
      if (!req.connection || typeof req.connection !== "object") {
        req.connection = { remoteAddress: undefined };
      }
      if (!req.socket || typeof req.socket !== "object") {
        req.socket = { remoteAddress: undefined };
      }

      const rateLimitError = new Error("RATE_LIMIT_EXCEEDED: Limite excedido");
      rateLimitError.rateLimitInfo = {
        message: "Limite excedido",
        timeLeftMinutes: 15,
        currentCount: 100,
        maxRequests: 100,
        resetTime: new Date().toISOString(),
        environment: "production",
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date().toISOString(),
        },
      };
      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(
        rateLimitError
      );

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Limite excedido",
        errors: {
          rate_limit: "Limite de consultas veiculares excedido",
          retry_after: "15 minutos",
          ip: "192.168.1.1",
          current_count: 100,
          max_requests: 100,
          reset_time: expect.any(String),
          environment: "production",
          timestamp: expect.any(String),
        },
      });
      expect(res.set).toHaveBeenCalledWith("X-RateLimit-Limit", "100");
      expect(res.set).toHaveBeenCalledWith("X-RateLimit-Remaining", "0");
      expect(res.set).toHaveBeenCalledWith(
        "X-RateLimit-Reset",
        expect.any(String)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("deve usar valores padrão quando rateLimitInfo está incompleto", async () => {
      // Arrange
      // Garantir que req está configurado corretamente
      req.body = { placa: "ABC1234" };
      req.ip = "192.168.1.1";
      // Garantir que connection e socket são objetos válidos
      if (!req.connection || typeof req.connection !== "object") {
        req.connection = { remoteAddress: undefined };
      }
      if (!req.socket || typeof req.socket !== "object") {
        req.socket = { remoteAddress: undefined };
      }

      const rateLimitError = new Error("RATE_LIMIT_EXCEEDED");
      rateLimitError.rateLimitInfo = {};
      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(
        rateLimitError
      );

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Muitas consultas veiculares. Tente novamente em 15 minutos.",
        errors: {
          rate_limit: "Limite de consultas veiculares excedido",
          retry_after: "15 minutos",
          ip: "192.168.1.1",
          current_count: 0,
          max_requests: 100,
          reset_time: undefined,
          environment: "production",
          timestamp: expect.any(String),
        },
      });
    });

    it("deve continuar com dados manuais quando API falha por outros motivos", async () => {
      // Arrange
      // Garantir que req está configurado corretamente
      req.body = { placa: "ABC1234", descricao: "Preciso de peças" };
      req.ip = "192.168.1.1";
      // Garantir que connection e socket são objetos válidos
      if (!req.connection || typeof req.connection !== "object") {
        req.connection = { remoteAddress: undefined };
      }
      if (!req.socket || typeof req.socket !== "object") {
        req.socket = { remoteAddress: undefined };
      }

      const apiError = new Error("API temporariamente indisponível");
      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(apiError);

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      expect(req.body.origem_dados_veiculo).toBe("manual");
      expect(req.body.descricao).toBe("Preciso de peças"); // Dados originais preservados
      expect(req.apiVeicularInfo).toEqual({
        consultado: true,
        origem: "manual",
        motivo: "api_falhou",
        erro: "API temporariamente indisponível",
        placa: "ABC1234",
        ip: "192.168.1.1",
        timestamp: expect.any(String),
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("deve tratar erro crítico no middleware e continuar", async () => {
      // Arrange
      // Simular erro crítico fazendo req.method lançar erro ao ser acessado
      const originalMethod = req.method;
      Object.defineProperty(req, "method", {
        get() {
          throw new Error("Erro crítico ao acessar method");
        },
        configurable: true,
      });

      // Act
      await consultaVeicularMiddleware(req, res, next);

      // Assert
      // O middleware deve tratar o erro e continuar
      expect(next).toHaveBeenCalledTimes(1);
      // Verificar que req.apiVeicularInfo foi definido com motivo de erro crítico
      expect(req.apiVeicularInfo).toEqual({
        consultado: false,
        origem: "manual",
        motivo: "erro_critico",
        erro: "Erro crítico ao acessar method",
        timestamp: expect.any(String),
      });
      expect(req.body.origem_dados_veiculo).toBe("manual");

      // Restaurar
      Object.defineProperty(req, "method", {
        value: originalMethod,
        configurable: true,
      });
    });
  });
});

describe("consultaVeicularSolicitacoesMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});

    req = {
      method: "POST",
      body: {},
      path: "",
      baseUrl: "",
      ip: "192.168.1.1",
    };

    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("deve ignorar rotas que não são de solicitações", async () => {
    // Arrange
    req.path = "/api/clientes";
    req.baseUrl = "/api";

    // Act
    await consultaVeicularSolicitacoesMiddleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(apiVeicularService.consultarVeiculoPorPlaca).not.toHaveBeenCalled();
  });

  it("deve aplicar middleware em rotas com /solicitacoes no path", async () => {
    // Arrange
    req.path = "/api/solicitacoes";
    req.body = { placa: "ABC1234" };
    apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
      origem_dados: "api",
      placa: "ABC1234",
    });

    // Act
    await consultaVeicularSolicitacoesMiddleware(req, res, next);

    // Assert
    expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("deve aplicar middleware em rotas com /requests no path", async () => {
    // Arrange
    req.path = "/api/requests";
    req.body = { placa: "ABC1234" };
    apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
      origem_dados: "api",
      placa: "ABC1234",
    });

    // Act
    await consultaVeicularSolicitacoesMiddleware(req, res, next);

    // Assert
    expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("deve aplicar middleware em rotas com /solicitacoes no baseUrl", async () => {
    // Arrange
    req.baseUrl = "/api/solicitacoes";
    req.body = { placa: "ABC1234" };
    apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
      origem_dados: "api",
      placa: "ABC1234",
    });

    // Act
    await consultaVeicularSolicitacoesMiddleware(req, res, next);

    // Assert
    expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("deve aplicar middleware em rotas com /requests no baseUrl", async () => {
    // Arrange
    req.baseUrl = "/api/requests";
    req.body = { placa: "ABC1234" };
    apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue({
      origem_dados: "api",
      placa: "ABC1234",
    });

    // Act
    await consultaVeicularSolicitacoesMiddleware(req, res, next);

    // Assert
    expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("logConsultaVeicularMiddleware", () => {
  let req, res, next;
  let originalSend;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});

    req = {
      method: "POST",
      path: "/api/solicitacoes",
      apiVeicularInfo: undefined,
    };

    originalSend = jest.fn();
    res = {
      statusCode: 200,
      send: originalSend,
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("deve logar quando há apiVeicularInfo", () => {
    // Arrange
    req.apiVeicularInfo = {
      placa: "ABC1234",
      origem: "api",
      motivo: "sucesso",
      timestamp: "2024-01-01T00:00:00.000Z",
    };

    // Act
    logConsultaVeicularMiddleware(req, res, next);

    // Simular chamada de res.send
    res.send({ success: true });

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith("📊 Log Consulta Veicular:", {
      placa: "ABC1234",
      origem: "api",
      motivo: "sucesso",
      timestamp: "2024-01-01T00:00:00.000Z",
      statusCode: 200,
      endpoint: "POST /api/solicitacoes",
    });
    expect(originalSend).toHaveBeenCalledWith({ success: true });
  });

  it("não deve logar quando não há apiVeicularInfo", () => {
    // Act
    logConsultaVeicularMiddleware(req, res, next);

    // Simular chamada de res.send
    res.send({ success: true });

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(console.log).not.toHaveBeenCalled();
    expect(originalSend).toHaveBeenCalledWith({ success: true });
  });

  it("deve usar motivo padrão 'sucesso' quando não especificado", () => {
    // Arrange
    req.apiVeicularInfo = {
      placa: "ABC1234",
      origem: "api",
      timestamp: "2024-01-01T00:00:00.000Z",
    };

    // Act
    logConsultaVeicularMiddleware(req, res, next);

    // Simular chamada de res.send
    res.send({ success: true });

    // Assert
    expect(console.log).toHaveBeenCalledWith("📊 Log Consulta Veicular:", {
      placa: "ABC1234",
      origem: "api",
      motivo: "sucesso",
      timestamp: "2024-01-01T00:00:00.000Z",
      statusCode: 200,
      endpoint: "POST /api/solicitacoes",
    });
  });
});
