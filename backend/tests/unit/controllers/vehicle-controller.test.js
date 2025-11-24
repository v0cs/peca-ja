// Mock do serviço ANTES de importar o controller
const mockApiVeicularService = {
  consultarVeiculoPorPlaca: jest.fn(),
  obterEstatisticasCache: jest.fn(),
  verificarConfiguracao: jest.fn(),
  obterEstatisticasRateLimit: jest.fn(),
  obterStatusCircuitBreaker: jest.fn(),
  forcarAberturaCircuitBreaker: jest.fn(),
  forcarFechamentoCircuitBreaker: jest.fn(),
  resetarMetricasCircuitBreaker: jest.fn(),
  limparCachePlaca: jest.fn(),
  limparRateLimit: jest.fn(),
  limparRateLimitCompleto: jest.fn(),
  limparCache: jest.fn(),
};

jest.mock("../../../src/services", () => ({
  apiVeicularService: mockApiVeicularService,
}));

// Importar após os mocks
const VehicleController = require("../../../src/controllers/vehicleController");
const { apiVeicularService } = require("../../../src/services");

describe("VehicleController", () => {
  let req, res;

  beforeEach(() => {
    // Limpar apenas os mocks chamados, não as implementações
    apiVeicularService.consultarVeiculoPorPlaca.mockClear();
    apiVeicularService.obterEstatisticasCache.mockClear();
    apiVeicularService.verificarConfiguracao.mockClear();
    apiVeicularService.obterEstatisticasRateLimit.mockClear();
    apiVeicularService.obterStatusCircuitBreaker.mockClear();
    apiVeicularService.forcarAberturaCircuitBreaker.mockClear();
    apiVeicularService.forcarFechamentoCircuitBreaker.mockClear();
    apiVeicularService.resetarMetricasCircuitBreaker.mockClear();
    apiVeicularService.limparCachePlaca.mockClear();
    apiVeicularService.limparRateLimit.mockClear();
    apiVeicularService.limparRateLimitCompleto.mockClear();
    apiVeicularService.limparCache.mockClear();

    req = {
      user: {
        userId: 1,
        tipo: "cliente",
      },
      params: {},
      query: {},
      ip: "127.0.0.1",
      connection: {
        remoteAddress: "127.0.0.1",
      },
      socket: {
        remoteAddress: "127.0.0.1",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };
  });

  describe("consultarPlaca", () => {
    it("deve consultar placa com sucesso", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const mockDadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        modelo: "Uno",
        ano_fabricacao: 2020,
        ano_modelo: 2020,
        categoria: "Passeio",
        cor: "Branco",
        chassi: "123456789",
        renavam: "987654321",
        origem_dados_veiculo: "api",
        timestamp_consulta: new Date().toISOString(),
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        mockDadosVeiculo
      );

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Consulta realizada com sucesso",
        data: expect.objectContaining({
          veiculo: expect.objectContaining({
            placa: "ABC1234",
            marca: "Fiat",
            modelo: "Uno",
          }),
          consulta_info: expect.objectContaining({
            consultado: true,
            usuario_id: 1,
            usuario_tipo: "cliente",
          }),
        }),
      });
    });

    it("deve retornar erro 400 quando placa não é fornecida", async () => {
      // Arrange
      req.params.placa = undefined;

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Placa é obrigatória",
        errors: {
          placa: "Parâmetro placa é obrigatório na URL",
        },
      });
    });

    it("deve adicionar headers de rate limiting quando disponível", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const mockDadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        modelo: "Uno",
        origem_dados_veiculo: "api",
        rate_limit_info: {
          headers: {
            "X-RateLimit-Remaining": "50",
            "X-RateLimit-Reset": "1234567890",
          },
        },
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        mockDadosVeiculo
      );

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.set).toHaveBeenCalledWith("X-RateLimit-Remaining", "50");
      expect(res.set).toHaveBeenCalledWith("X-RateLimit-Reset", "1234567890");
    });

    it("deve retornar erro 429 quando rate limit é excedido", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const error = new Error("RATE_LIMIT_EXCEEDED: Limite excedido");
      error.rateLimitInfo = {
        message: "Muitas consultas",
        timeLeftMinutes: 15,
        currentCount: 100,
        maxRequests: 100,
        resetTime: new Date().toISOString(),
        environment: "production",
        headers: {
          "X-RateLimit-Remaining": "0",
        },
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(error);

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.set).toHaveBeenCalledWith("X-RateLimit-Remaining", "0");
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Muitas consultas",
        errors: expect.objectContaining({
          rate_limit: "Limite de consultas veiculares excedido",
          retry_after: "15 minutos",
          ip: "127.0.0.1",
        }),
        debug_info: expect.any(Object),
      });
    });

    it("deve retornar erro 400 quando formato de placa é inválido", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const error = new Error("Formato de placa inválido");

      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(error);

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Formato de placa inválido",
        errors: expect.objectContaining({
          placa: expect.stringContaining("Placa deve estar no formato"),
        }),
        debug_info: expect.any(Object),
      });
    });

    it("deve retornar erro 503 quando API não está configurada", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const error = new Error("API não configurada");

      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(error);

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Serviço de consulta veicular temporariamente indisponível",
        errors: expect.objectContaining({
          motivo: "API veicular não configurada",
        }),
        debug_info: expect.any(Object),
      });
    });

    it("deve retornar erro 502 quando API externa retorna erro", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const error = {
        message: "Erro na API",
        response: {
          status: 500,
          data: {
            message: "Erro na API",
          },
        },
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(error);

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro na consulta à API veicular",
        errors: expect.objectContaining({
          api_status: 500,
        }),
        debug_info: expect.any(Object),
      });
    });

    it("deve retornar erro 504 quando ocorre timeout", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const error = {
        message: "Timeout",
        code: "ECONNABORTED",
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(error);

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Timeout na consulta à API veicular",
        errors: expect.objectContaining({
          motivo: "API veicular não respondeu no tempo esperado",
        }),
        debug_info: expect.any(Object),
      });
    });

    it("deve retornar erro 500 quando ocorre erro interno", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const error = new Error("Erro interno");

      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(error);

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {},
        debug_info: expect.any(Object),
      });
    });

    it("deve usar IP do req.ip quando disponível", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      req.ip = "192.168.1.1";
      const mockDadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        origem_dados_veiculo: "api",
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        mockDadosVeiculo
      );

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "192.168.1.1"
      );
    });

    it("deve usar IP do req.connection.remoteAddress quando req.ip não existe", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      req.ip = undefined;
      req.connection.remoteAddress = "192.168.1.2";
      req.socket.remoteAddress = undefined;
      const mockDadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        origem_dados_veiculo: "api",
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        mockDadosVeiculo
      );

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "192.168.1.2"
      );
    });

    it("deve usar IP do req.socket.remoteAddress quando req.ip e req.connection.remoteAddress não existem", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      req.ip = undefined;
      req.connection.remoteAddress = undefined;
      req.socket.remoteAddress = "192.168.1.3";
      const mockDadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        origem_dados_veiculo: "api",
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        mockDadosVeiculo
      );

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "192.168.1.3"
      );
    });

    it("deve usar IP padrão 127.0.0.1 quando nenhum IP está disponível", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      req.ip = undefined;
      req.connection.remoteAddress = undefined;
      req.socket.remoteAddress = undefined;
      const mockDadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        origem_dados_veiculo: "api",
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        mockDadosVeiculo
      );

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(apiVeicularService.consultarVeiculoPorPlaca).toHaveBeenCalledWith(
        "ABC1234",
        "127.0.0.1"
      );
    });

    it("deve incluir api_veicular_metadata quando presente na resposta", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const mockDadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        modelo: "Uno",
        origem_dados_veiculo: "api",
        api_veicular_metadata: {
          response_time: 150,
          cached: false,
        },
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        mockDadosVeiculo
      );

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            api_metadata: mockDadosVeiculo.api_veicular_metadata,
          }),
        })
      );
    });

    it("deve usar timestamp atual quando timestamp_consulta não está presente", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      const mockDadosVeiculo = {
        placa: "ABC1234",
        marca: "Fiat",
        origem_dados_veiculo: "api",
      };

      apiVeicularService.consultarVeiculoPorPlaca.mockResolvedValue(
        mockDadosVeiculo
      );

      const beforeCall = new Date().toISOString();

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      const afterCall = new Date().toISOString();
      const responseData = res.json.mock.calls[0][0];
      const timestamp = responseData.data.consulta_info.timestamp;

      expect(timestamp).toBeDefined();
      expect(timestamp >= beforeCall && timestamp <= afterCall).toBe(true);
    });

    it("deve tratar erro quando req.user não existe no catch", async () => {
      // Arrange
      req.params.placa = "ABC1234";
      delete req.user;
      const error = new Error("Erro interno");

      apiVeicularService.consultarVeiculoPorPlaca.mockRejectedValue(error);

      // Act
      await VehicleController.consultarPlaca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          debug_info: expect.objectContaining({
            usuario_id: "não autenticado",
          }),
        })
      );
    });
  });

  describe("obterEstatisticas", () => {
    it("deve obter estatísticas com sucesso para admin", async () => {
      // Arrange
      req.user.tipo = "admin";
      const mockStats = {
        cache: { hits: 10, misses: 5 },
        rate_limiting: { total: 100 },
        circuit_breaker: { state: "closed" },
      };
      const mockConfig = { apiKey: "test" };
      const mockRateLimitStats = { current: 50, max: 100 };

      apiVeicularService.obterEstatisticasCache.mockReturnValue(mockStats);
      apiVeicularService.verificarConfiguracao.mockReturnValue(mockConfig);
      apiVeicularService.obterEstatisticasRateLimit.mockReturnValue(
        mockRateLimitStats
      );

      // Act
      await VehicleController.obterEstatisticas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Estatísticas obtidas com sucesso",
        data: expect.objectContaining({
          cache_stats: mockStats.cache,
          rate_limiting_stats: mockStats.rate_limiting,
          circuit_breaker_stats: mockStats.circuit_breaker,
          client_rate_limit: mockRateLimitStats,
          configuracao: mockConfig,
        }),
      });
    });

    it("deve obter estatísticas com sucesso para autopeca", async () => {
      // Arrange
      req.user.tipo = "autopeca";
      const mockStats = {
        cache: { hits: 10 },
        rate_limiting: { total: 100 },
        circuit_breaker: { state: "closed" },
      };

      apiVeicularService.obterEstatisticasCache.mockReturnValue(mockStats);
      apiVeicularService.verificarConfiguracao.mockReturnValue({});
      apiVeicularService.obterEstatisticasRateLimit.mockReturnValue({});

      // Act
      await VehicleController.obterEstatisticas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deve retornar erro 403 quando usuário não é admin ou autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VehicleController.obterEstatisticas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          authorization: expect.stringContaining("Apenas administradores"),
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.user.tipo = "admin";
      apiVeicularService.obterEstatisticasCache.mockImplementation(() => {
        throw new Error("Erro ao obter estatísticas");
      });

      // Act
      await VehicleController.obterEstatisticas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        error: "Erro ao obter estatísticas",
      });
    });

    it("deve usar IP do req.connection.remoteAddress quando req.ip não existe", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.ip = undefined;
      req.connection.remoteAddress = "192.168.1.2";
      req.socket.remoteAddress = undefined;
      const mockStats = {
        cache: { hits: 10 },
        rate_limiting: { total: 100 },
        circuit_breaker: { state: "closed" },
      };

      apiVeicularService.obterEstatisticasCache.mockReturnValue(mockStats);
      apiVeicularService.verificarConfiguracao.mockReturnValue({});
      apiVeicularService.obterEstatisticasRateLimit.mockReturnValue({});

      // Act
      await VehicleController.obterEstatisticas(req, res);

      // Assert
      expect(
        apiVeicularService.obterEstatisticasRateLimit
      ).toHaveBeenCalledWith("192.168.1.2");
    });

    it("deve usar IP do req.socket.remoteAddress quando req.ip e req.connection.remoteAddress não existem", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.ip = undefined;
      req.connection.remoteAddress = undefined;
      req.socket.remoteAddress = "192.168.1.3";
      const mockStats = {
        cache: { hits: 10 },
        rate_limiting: { total: 100 },
        circuit_breaker: { state: "closed" },
      };

      apiVeicularService.obterEstatisticasCache.mockReturnValue(mockStats);
      apiVeicularService.verificarConfiguracao.mockReturnValue({});
      apiVeicularService.obterEstatisticasRateLimit.mockReturnValue({});

      // Act
      await VehicleController.obterEstatisticas(req, res);

      // Assert
      expect(
        apiVeicularService.obterEstatisticasRateLimit
      ).toHaveBeenCalledWith("192.168.1.3");
    });

    it("deve usar IP padrão 127.0.0.1 quando nenhum IP está disponível em obterEstatisticas", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.ip = undefined;
      req.connection.remoteAddress = undefined;
      req.socket.remoteAddress = undefined;
      const mockStats = {
        cache: { hits: 10 },
        rate_limiting: { total: 100 },
        circuit_breaker: { state: "closed" },
      };

      apiVeicularService.obterEstatisticasCache.mockReturnValue(mockStats);
      apiVeicularService.verificarConfiguracao.mockReturnValue({});
      apiVeicularService.obterEstatisticasRateLimit.mockReturnValue({});

      // Act
      await VehicleController.obterEstatisticas(req, res);

      // Assert
      expect(
        apiVeicularService.obterEstatisticasRateLimit
      ).toHaveBeenCalledWith("127.0.0.1");
    });
  });

  describe("limparCache", () => {
    it("deve limpar cache completo com sucesso", async () => {
      // Arrange
      req.user.tipo = "admin";

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(apiVeicularService.limparCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Cache completo limpo",
        data: expect.objectContaining({
          acao: "limpeza_cache_completa",
        }),
      });
    });

    it("deve limpar cache de placa específica", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.query.placa = "ABC1234";

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(apiVeicularService.limparCachePlaca).toHaveBeenCalledWith(
        "ABC1234"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Cache limpo para placa ABC1234",
        data: expect.objectContaining({
          acao: "limpeza_cache_especifica",
          placa: "ABC1234",
        }),
      });
    });

    it("deve limpar rate limit de IP específico", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.query.ip = "192.168.1.1";

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(apiVeicularService.limparRateLimit).toHaveBeenCalledWith(
        "192.168.1.1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Rate limit limpo para IP 192.168.1.1",
        data: expect.objectContaining({
          acao: "limpeza_rate_limit_especifica",
          ip: "192.168.1.1",
        }),
      });
    });

    it("deve limpar rate limit completo", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.query.rate_limit = "true";

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(apiVeicularService.limparRateLimitCompleto).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Rate limiting completo limpo",
        data: expect.objectContaining({
          acao: "limpeza_rate_limit_completa",
          rate_limit_cleared: true,
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é admin", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Acesso negado",
        errors: {
          authorization: "Apenas administradores podem limpar o cache",
        },
      });
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.user.tipo = "admin";
      apiVeicularService.limparCache.mockImplementation(() => {
        throw new Error("Erro ao limpar cache");
      });

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("deve retornar erro 500 quando ocorre erro ao limpar cache de placa", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.query.placa = "ABC1234";
      apiVeicularService.limparCachePlaca.mockImplementation(() => {
        throw new Error("Erro ao limpar cache de placa");
      });

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("deve retornar erro 500 quando ocorre erro ao limpar rate limit", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.query.ip = "192.168.1.1";
      apiVeicularService.limparRateLimit.mockImplementation(() => {
        throw new Error("Erro ao limpar rate limit");
      });

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("deve retornar erro 500 quando ocorre erro ao limpar rate limit completo", async () => {
      // Arrange
      req.user.tipo = "admin";
      req.query.rate_limit = "true";
      apiVeicularService.limparRateLimitCompleto.mockImplementation(() => {
        throw new Error("Erro ao limpar rate limit completo");
      });

      // Act
      await VehicleController.limparCache(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("obterStatusCircuitBreaker", () => {
    it("deve obter status do circuit breaker com sucesso", async () => {
      // Arrange
      req.user.tipo = "admin";
      const mockStatus = {
        state: "closed",
        failures: 0,
        successes: 100,
      };

      apiVeicularService.obterStatusCircuitBreaker.mockReturnValue(mockStatus);

      // Act
      await VehicleController.obterStatusCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Status do circuit breaker obtido com sucesso",
        data: mockStatus,
      });
    });

    it("deve obter status do circuit breaker com sucesso para autopeca", async () => {
      // Arrange
      req.user.tipo = "autopeca";
      const mockStatus = {
        state: "open",
        failures: 5,
        successes: 95,
      };

      apiVeicularService.obterStatusCircuitBreaker.mockReturnValue(mockStatus);

      // Act
      await VehicleController.obterStatusCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Status do circuit breaker obtido com sucesso",
        data: mockStatus,
      });
    });

    it("deve retornar erro 403 quando usuário não é admin ou autopeca", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VehicleController.obterStatusCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.user.tipo = "admin";
      apiVeicularService.obterStatusCircuitBreaker.mockImplementation(() => {
        throw new Error("Erro");
      });

      // Act
      await VehicleController.obterStatusCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("forcarAberturaCircuitBreaker", () => {
    it("deve forçar abertura do circuit breaker com sucesso", async () => {
      // Arrange
      req.user.tipo = "admin";

      // Act
      await VehicleController.forcarAberturaCircuitBreaker(req, res);

      // Assert
      expect(
        apiVeicularService.forcarAberturaCircuitBreaker
      ).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Circuit breaker forçado a abrir",
        data: expect.objectContaining({
          action: "circuit_breaker_forced_open",
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é admin", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VehicleController.forcarAberturaCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.user.tipo = "admin";
      apiVeicularService.forcarAberturaCircuitBreaker.mockImplementation(() => {
        throw new Error("Erro ao forçar abertura");
      });

      // Act
      await VehicleController.forcarAberturaCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("forcarFechamentoCircuitBreaker", () => {
    it("deve forçar fechamento do circuit breaker com sucesso", async () => {
      // Arrange
      req.user.tipo = "admin";

      // Act
      await VehicleController.forcarFechamentoCircuitBreaker(req, res);

      // Assert
      expect(
        apiVeicularService.forcarFechamentoCircuitBreaker
      ).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Circuit breaker forçado a fechar",
        data: expect.objectContaining({
          action: "circuit_breaker_forced_close",
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é admin", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VehicleController.forcarFechamentoCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.user.tipo = "admin";
      apiVeicularService.forcarFechamentoCircuitBreaker.mockImplementation(
        () => {
          throw new Error("Erro ao forçar fechamento");
        }
      );

      // Act
      await VehicleController.forcarFechamentoCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("resetarMetricasCircuitBreaker", () => {
    it("deve resetar métricas do circuit breaker com sucesso", async () => {
      // Arrange
      req.user.tipo = "admin";

      // Act
      await VehicleController.resetarMetricasCircuitBreaker(req, res);

      // Assert
      expect(
        apiVeicularService.resetarMetricasCircuitBreaker
      ).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Métricas do circuit breaker resetadas",
        data: expect.objectContaining({
          action: "circuit_breaker_metrics_reset",
        }),
      });
    });

    it("deve retornar erro 403 quando usuário não é admin", async () => {
      // Arrange
      req.user.tipo = "cliente";

      // Act
      await VehicleController.resetarMetricasCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("deve retornar erro 500 quando ocorre erro", async () => {
      // Arrange
      req.user.tipo = "admin";
      apiVeicularService.resetarMetricasCircuitBreaker.mockImplementation(
        () => {
          throw new Error("Erro ao resetar métricas");
        }
      );

      // Act
      await VehicleController.resetarMetricasCircuitBreaker(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
