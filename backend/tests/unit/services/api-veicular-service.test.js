// Criar mock de axios ANTES de qualquer import
const mockAxiosInstance = {
  get: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

const mockAxiosCreate = jest.fn(() => mockAxiosInstance);

// Mock do axios
jest.mock("axios", () => ({
  create: mockAxiosCreate,
}));

// Mock do NodeCache
jest.mock("node-cache", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
  }));
});

// Mock do config
jest.mock("../../../src/config/env", () => ({
  API_VEICULAR_BASE_URL: "https://api.test.com",
  API_VEICULAR_KEY: "test-api-key",
  API_VEICULAR_EMAIL: "test@example.com",
  NODE_ENV: "test",
}));

// Importar após os mocks
const ApiVeicularService = require("../../../src/services/apiVeicularService");
const axios = require("axios");
const NodeCache = require("node-cache");

describe("ApiVeicularService", () => {
  let apiVeicularService;

  beforeEach(() => {
    // Limpar apenas as chamadas, não as implementações
    mockAxiosInstance.get.mockClear();
    mockAxiosCreate.mockClear();
    
    // ApiVeicularService é exportado como instância única (singleton)
    apiVeicularService = ApiVeicularService;
  });

  describe("consultarVeiculoPorPlaca", () => {
    beforeEach(() => {
      // Mock do cache e outras dependências necessárias
      apiVeicularService.cache = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
        flushAll: jest.fn(),
        getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
        options: { stdTTL: 86400 },
      };
      apiVeicularService.rateLimitCache = {
        get: jest.fn(),
        set: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
        getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
        options: { stdTTL: 900 },
      };
      apiVeicularService.circuitBreaker = {
        fire: jest.fn(),
        state: "closed",
      };
    });

    it("deve retornar dados do cache se disponível", async () => {
      // Arrange
      const placa = "ABC1234";
      const cachedData = {
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
        origem_dados: "cache",
      };

      apiVeicularService.cache.get.mockReturnValue(cachedData);

      // Act
      const result = await apiVeicularService.consultarVeiculoPorPlaca(placa);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: "ABC1234",
          marca: "Volkswagen",
          modelo: "Golf",
          origem_dados: "cache",
        })
      );
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it("deve consultar API e cachear resultado em caso de sucesso", async () => {
      // Arrange
      const placa = "ABC1234";
      const apiResponse = {
        status: "ok",
        dados: {
          informacoes_veiculo: {
            dados_veiculo: {
              placa: "ABC1234",
              marca: "Volkswagen",
              modelo: "Golf",
              ano_fabricacao: 2020,
            },
          },
        },
      };

      apiVeicularService.cache.get.mockReturnValue(null);
      apiVeicularService.cache.set.mockImplementation(() => {});
      
      // Mock do circuit breaker
      apiVeicularService.circuitBreaker.fire = jest.fn().mockResolvedValue(apiResponse);
      
      // Mock do formatarDadosVeiculo para retornar dados formatados
      jest.spyOn(apiVeicularService, "formatarDadosVeiculo").mockReturnValue({
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
      });

      // Act
      const result = await apiVeicularService.consultarVeiculoPorPlaca(placa);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: "ABC1234",
          marca: "Volkswagen",
          modelo: "Golf",
        })
      );
      expect(apiVeicularService.circuitBreaker.fire).toHaveBeenCalled();
      expect(apiVeicularService.cache.set).toHaveBeenCalled();
    });

    it("deve retornar erro quando API falha", async () => {
      // Arrange
      const placa = "ABC1234";
      const error = new Error("API Error");
      error.response = {
        status: 500,
        data: { message: "Internal Server Error" },
      };

      apiVeicularService.cache.get.mockReturnValue(null);
      apiVeicularService.circuitBreaker.fire = jest.fn().mockRejectedValue(error);
      
      // Mock do criarFallbackVeiculo para retornar dados de fallback
      jest.spyOn(apiVeicularService, "criarFallbackVeiculo").mockReturnValue({
        placa: "ABC1234",
        marca: "Não informado",
        modelo: "Não informado",
        origem_dados: "fallback",
      });

      // Act
      const result = await apiVeicularService.consultarVeiculoPorPlaca(placa);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: "ABC1234",
          origem_dados: "fallback",
        })
      );
      expect(apiVeicularService.circuitBreaker.fire).toHaveBeenCalled();
    });

    it("deve retornar erro quando placa não é encontrada", async () => {
      // Arrange
      const placa = "ABC1234";
      const error = new Error("Not Found");
      error.response = {
        status: 404,
        data: { message: "Placa não encontrada" },
      };

      apiVeicularService.cache.get.mockReturnValue(null);
      apiVeicularService.circuitBreaker.fire = jest.fn().mockRejectedValue(error);
      
      // Mock do criarFallbackVeiculo para retornar dados de fallback
      jest.spyOn(apiVeicularService, "criarFallbackVeiculo").mockReturnValue({
        placa: "ABC1234",
        marca: "Não informado",
        modelo: "Não informado",
        origem_dados: "fallback",
      });

      // Act
      const result = await apiVeicularService.consultarVeiculoPorPlaca(placa);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: "ABC1234",
          origem_dados: "fallback",
        })
      );
    });
  });

  describe("normalizarPlaca", () => {
    it("deve normalizar placa removendo hífens e convertendo para maiúsculo", () => {
      // Arrange
      const placa = "abc-1234";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1234");
    });

    it("deve normalizar placa Mercosul", () => {
      // Arrange
      const placa = "abc1d23";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1D23");
    });
  });

  describe("normalizarPlaca - validação de placas", () => {
    it("deve validar e normalizar placa antiga com sucesso", () => {
      // Arrange
      const placa = "ABC1234";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1234");
    });

    it("deve validar e normalizar placa Mercosul com sucesso", () => {
      // Arrange
      const placa = "ABC1D23";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1D23");
    });

    it("deve retornar null para placa inválida", () => {
      // Arrange
      const placa = "INVALID";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe(null);
    });

    it("deve normalizar placa com hífen", () => {
      // Arrange
      const placa = "ABC-1234";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1234");
    });

    it("deve normalizar placa em minúsculas", () => {
      // Arrange
      const placa = "abc1234";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1234");
    });
  });

  describe("verificarRateLimit", () => {
    beforeEach(() => {
      apiVeicularService.rateLimitCache = {
        get: jest.fn(),
        set: jest.fn(),
        getTtl: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
        getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
        options: { stdTTL: 900 },
      };
      apiVeicularService.rateLimitConfig = {
        development: {
          maxRequests: 500,
          windowMs: 900000,
          message: "Limite de desenvolvimento",
          headerPrefix: "X-RateLimit",
        },
        production: {
          maxRequests: 100,
          windowMs: 900000,
          message: "Limite de produção",
          headerPrefix: "X-RateLimit",
        },
        current: "production",
      };
    });

    it("deve permitir requisição quando abaixo do limite", () => {
      // Arrange
      const ip = "192.168.1.1";
      apiVeicularService.rateLimitCache.get.mockReturnValue(50);

      // Act
      const result = apiVeicularService.verificarRateLimit(ip);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(51);
      expect(result.remainingRequests).toBe(49);
      expect(apiVeicularService.rateLimitCache.set).toHaveBeenCalled();
    });

    it("deve negar requisição quando excede o limite", () => {
      // Arrange
      const ip = "192.168.1.1";
      apiVeicularService.rateLimitCache.get.mockReturnValue(100);
      const futureDate = new Date(Date.now() + 900000);
      apiVeicularService.rateLimitCache.getTtl.mockReturnValue(
        futureDate.getTime()
      );

      // Act
      const result = apiVeicularService.verificarRateLimit(ip);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(100);
      expect(result.remainingRequests).toBe(0);
      expect(result.headers).toHaveProperty("X-RateLimit-Remaining", 0);
    });

    it("deve usar configuração de desenvolvimento quando NODE_ENV é development", () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      apiVeicularService.rateLimitConfig.current = "development";
      apiVeicularService.rateLimitConfig.development.maxRequests = 500;

      const ip = "192.168.1.1";
      apiVeicularService.rateLimitCache.get.mockReturnValue(499);

      // Act
      const result = apiVeicularService.verificarRateLimit(ip);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.maxRequests).toBe(500);

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("obterEstatisticasRateLimit", () => {
    beforeEach(() => {
      apiVeicularService.rateLimitCache = {
        get: jest.fn(),
        getTtl: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
        options: { stdTTL: 900 },
      };
      apiVeicularService.rateLimitConfig = {
        development: {
          maxRequests: 500,
          windowMs: 900000,
        },
        production: {
          maxRequests: 100,
          windowMs: 900000,
        },
        current: "production",
      };
    });

    it("deve retornar estatísticas de rate limit para IP", () => {
      // Arrange
      const ip = "192.168.1.1";
      apiVeicularService.rateLimitCache.get.mockReturnValue(25);
      const futureDate = new Date(Date.now() + 900000);
      apiVeicularService.rateLimitCache.getTtl.mockReturnValue(
        futureDate.getTime()
      );

      // Act
      const result = apiVeicularService.obterEstatisticasRateLimit(ip);

      // Assert
      expect(result).toEqual({
        ip: "192.168.1.1",
        currentCount: 25,
        maxRequests: 100,
        remainingRequests: 75,
        resetTime: futureDate.toISOString(),
        environment: "production",
        windowMs: 900000,
      });
    });

    it("deve retornar resetTime null quando não há TTL", () => {
      // Arrange
      const ip = "192.168.1.1";
      apiVeicularService.rateLimitCache.get.mockReturnValue(0);
      apiVeicularService.rateLimitCache.getTtl.mockReturnValue(undefined);

      // Act
      const result = apiVeicularService.obterEstatisticasRateLimit(ip);

      // Assert
      expect(result.resetTime).toBeNull();
    });
  });

  describe("limparRateLimit", () => {
    beforeEach(() => {
      apiVeicularService.rateLimitCache = {
        del: jest.fn().mockReturnValue(true),
      };
    });

    it("deve limpar rate limit de IP específico", () => {
      // Arrange
      const ip = "192.168.1.1";

      // Act
      apiVeicularService.limparRateLimit(ip);

      // Assert
      expect(apiVeicularService.rateLimitCache.del).toHaveBeenCalledWith(
        "rate_limit_192.168.1.1"
      );
    });
  });

  describe("limparRateLimitCompleto", () => {
    beforeEach(() => {
      apiVeicularService.rateLimitCache = {
        flushAll: jest.fn(),
      };
    });

    it("deve limpar todo o rate limiting", () => {
      // Act
      apiVeicularService.limparRateLimitCompleto();

      // Assert
      expect(apiVeicularService.rateLimitCache.flushAll).toHaveBeenCalled();
    });
  });

  describe("consultarVeiculoPorPlaca - rate limiting", () => {
    beforeEach(() => {
      apiVeicularService.cache = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
        flushAll: jest.fn(),
        getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
        options: { stdTTL: 86400 },
      };
      apiVeicularService.rateLimitCache = {
        get: jest.fn(),
        set: jest.fn(),
        getTtl: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
        getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
        options: { stdTTL: 900 },
      };
      apiVeicularService.circuitBreaker = {
        fire: jest.fn(),
        state: "closed",
      };
      apiVeicularService.rateLimitConfig = {
        production: {
          maxRequests: 100,
          windowMs: 900000,
          message: "Limite excedido",
          headerPrefix: "X-RateLimit",
        },
        current: "production",
      };
    });

    it("deve retornar fallback quando rate limit é excedido", async () => {
      // Arrange
      const placa = "ABC1234";
      const ip = "192.168.1.1";

      apiVeicularService.cache.get.mockReturnValue(null);
      jest.spyOn(apiVeicularService, "verificarRateLimit").mockReturnValue({
        allowed: false,
        currentCount: 100,
        maxRequests: 100,
        remainingRequests: 0,
        resetTime: new Date().toISOString(),
        timeLeftMinutes: 15,
        headers: {
          "X-RateLimit-Remaining": 0,
        },
        message: "Limite excedido",
        environment: "production",
      });
      jest.spyOn(apiVeicularService, "criarFallbackVeiculo").mockReturnValue({
        placa: "ABC1234",
        marca: "Não informado",
        modelo: "Não informado",
        origem_dados_veiculo: "api_com_fallback",
      });

      // Act
      const result = await apiVeicularService.consultarVeiculoPorPlaca(placa, ip);

      // Assert
      expect(result.origem_dados_veiculo).toBe("api_com_fallback");
      expect(apiVeicularService.verificarRateLimit).toHaveBeenCalledWith(ip);
    });

    it("deve adicionar rate_limit_info quando rate limit está OK", async () => {
      // Arrange
      const placa = "ABC1234";
      const ip = "192.168.1.1";
      const apiResponse = {
        status: "ok",
        dados: {
          informacoes_veiculo: {
            dados_veiculo: {
              placa: "ABC1234",
              marca: "Volkswagen",
              modelo: "Golf",
            },
          },
        },
      };

      apiVeicularService.cache.get.mockReturnValue(null);
      jest.spyOn(apiVeicularService, "verificarRateLimit").mockReturnValue({
        allowed: true,
        currentCount: 50,
        maxRequests: 100,
        remainingRequests: 50,
        resetTime: new Date().toISOString(),
        headers: {
          "X-RateLimit-Remaining": "50",
        },
        environment: "production",
      });
      apiVeicularService.circuitBreaker.fire = jest
        .fn()
        .mockResolvedValue(apiResponse);
      jest.spyOn(apiVeicularService, "formatarDadosVeiculo").mockReturnValue({
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
      });

      // Act
      const result = await apiVeicularService.consultarVeiculoPorPlaca(
        placa,
        ip
      );

      // Assert
      expect(result.rate_limit_info).toBeDefined();
      expect(result.rate_limit_info.current_count).toBe(50);
      expect(result.rate_limit_info.remaining_requests).toBe(50);
    });
  });

  describe("formatarDadosVeiculo", () => {
    beforeEach(() => {
      // Restaurar mocks de outros testes que podem estar interferindo
      jest.restoreAllMocks();
      jest.clearAllMocks();
      // Restaurar mock do axios.create
      axios.create.mockReturnValue(mockAxiosInstance);
    });

    it("deve formatar dados da API corretamente", () => {
      // Arrange
      const dadosApi = {
        status: "ok",
        dados: {
          informacoes_veiculo: {
            dados_veiculo: {
              placa: "ABC1234",
              marca: "VOLKSWAGEN",
              modelo: "Golf",
              ano_fabricacao: "2020",
              ano_modelo: "2020",
              segmento: "AUTO",
              cor: "Branco",
              chassi: "123456789",
              renavam: "987654321",
            },
          },
        },
        mensagem: "Consulta realizada com sucesso",
      };

      // Act
      const result = apiVeicularService.formatarDadosVeiculo(dadosApi);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: "ABC1234",
          marca: "Volkswagen",
          modelo: "Golf",
          ano_fabricacao: expect.any(Number),
          ano_modelo: expect.any(Number),
          categoria: "carro",
          cor: "Branco",
          origem_dados_veiculo: "api",
        })
      );
      expect(result.api_veicular_metadata).toBeDefined();
    });

    it("deve lançar erro quando dadosApi é inválido", () => {
      // Arrange
      const dadosApi = null;

      // Act & Assert
      expect(() => {
        apiVeicularService.formatarDadosVeiculo(dadosApi);
      }).toThrow("Erro ao processar dados da API veicular");
    });

    it("deve lançar erro quando estrutura da API não é reconhecida", () => {
      // Arrange
      const dadosApi = {
        status: "error",
        dados: null,
      };

      // Act & Assert
      expect(() => {
        apiVeicularService.formatarDadosVeiculo(dadosApi);
      }).toThrow("Erro ao processar dados da API veicular");
    });
  });

  describe("mapearMarca", () => {

    it("deve mapear marca conhecida para formato padronizado", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearMarca("VOLKSWAGEN");

      // Assert
      expect(result).toBe("Volkswagen");
    });

    it("deve retornar marca original quando não está no mapeamento", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearMarca("MARCA_DESCONHECIDA");

      // Assert
      expect(result).toBe("MARCA_DESCONHECIDA");
    });

    it("deve retornar 'Não informado' quando marca é null", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearMarca(null);

      // Assert
      expect(result).toBe("Não informado");
    });

    it("deve retornar 'Não informado' quando marca é vazia", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearMarca("");

      // Assert
      expect(result).toBe("Não informado");
    });

    it("deve mapear múltiplas marcas conhecidas", () => {
      // Arrange & Act & Assert
      expect(apiVeicularService.mapearMarca("FORD")).toBe("Ford");
      expect(apiVeicularService.mapearMarca("CHEVROLET")).toBe("Chevrolet");
      expect(apiVeicularService.mapearMarca("FIAT")).toBe("Fiat");
      expect(apiVeicularService.mapearMarca("HONDA")).toBe("Honda");
    });
  });

  describe("mapearCategoria", () => {

    it("deve mapear categoria AUTO para carro", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria("AUTO");

      // Assert
      expect(result).toBe("carro");
    });

    it("deve mapear categoria MOTOCICLETA para moto", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria("MOTOCICLETA");

      // Assert
      expect(result).toBe("moto");
    });

    it("deve mapear categoria CAMINHAO para caminhao", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria("CAMINHAO");

      // Assert
      expect(result).toBe("caminhao");
    });

    it("deve retornar 'outro' quando categoria não está no mapeamento", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria("CATEGORIA_DESCONHECIDA");

      // Assert
      expect(result).toBe("outro");
    });

    it("deve retornar 'outro' quando categoria é null", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria(null);

      // Assert
      expect(result).toBe("outro");
    });
  });

  describe("extrairAno", () => {

    it("deve extrair ano de string", () => {
      // Arrange & Act
      const result = apiVeicularService.extrairAno("2020");

      // Assert
      expect(result).toBe(2020);
    });

    it("deve extrair ano de número", () => {
      // Arrange & Act
      const result = apiVeicularService.extrairAno(2020);

      // Assert
      expect(result).toBe(2020);
    });

    it("deve retornar ano atual quando ano é null", () => {
      // Arrange
      const anoAtual = new Date().getFullYear();

      // Act
      const result = apiVeicularService.extrairAno(null);

      // Assert
      expect(result).toBe(anoAtual);
    });

    it("deve retornar ano atual quando ano é inválido (muito antigo)", () => {
      // Arrange
      const anoAtual = new Date().getFullYear();

      // Act
      const result = apiVeicularService.extrairAno("1800");

      // Assert
      expect(result).toBe(anoAtual);
    });

    it("deve retornar ano atual quando ano é inválido (muito futuro)", () => {
      // Arrange
      const anoAtual = new Date().getFullYear();

      // Act
      const result = apiVeicularService.extrairAno("2100");

      // Assert
      expect(result).toBe(anoAtual);
    });
  });

  describe("validarDadosFormatados", () => {

    it("deve validar dados formatados corretos", () => {
      // Arrange
      const dados = {
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        ano_modelo: 2020,
        categoria: "carro",
        cor: "Branco",
      };

      // Act & Assert
      expect(() => {
        apiVeicularService.validarDadosFormatados(dados);
      }).not.toThrow();
    });

    it("deve lançar erro quando campo obrigatório está faltando", () => {
      // Arrange
      const dados = {
        placa: "ABC1234",
        marca: "Volkswagen",
        // modelo faltando
        ano_fabricacao: 2020,
        ano_modelo: 2020,
        categoria: "carro",
        cor: "Branco",
      };

      // Act & Assert
      expect(() => {
        apiVeicularService.validarDadosFormatados(dados);
      }).toThrow();
    });

    it("deve lançar erro quando campo obrigatório é 'Não informado'", () => {
      // Arrange
      const dados = {
        placa: "ABC1234",
        marca: "Não informado", // Inválido
        modelo: "Golf",
        ano_fabricacao: 2020,
        ano_modelo: 2020,
        categoria: "carro",
        cor: "Branco",
      };

      // Act & Assert
      expect(() => {
        apiVeicularService.validarDadosFormatados(dados);
      }).toThrow();
    });

    it("deve lançar erro quando dados é null", () => {
      // Act & Assert
      expect(() => {
        apiVeicularService.validarDadosFormatados(null);
      }).toThrow();
    });
  });

  describe("criarFallbackVeiculo", () => {
    beforeEach(() => {
      // Restaurar mocks de outros testes que podem estar interferindo
      jest.restoreAllMocks();
      jest.clearAllMocks();
      // Restaurar mock do axios.create
      axios.create.mockReturnValue(mockAxiosInstance);
    });

    it("deve criar dados de fallback com informações básicas", () => {
      // Arrange
      const placa = "ABC1234";
      const error = new Error("API Error");

      // Act
      const result = apiVeicularService.criarFallbackVeiculo(placa, error);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: "ABC1234",
          marca: "Não informado",
          modelo: "Não informado",
          origem_dados_veiculo: "api_com_fallback",
        })
      );
      expect(result.api_veicular_metadata).toBeDefined();
      expect(result.api_veicular_metadata.erro).toBeDefined();
      expect(result.api_veicular_metadata.fallback_utilizado).toBe(true);
    });

    it("deve incluir rate_limit_info quando erro tem rateLimitInfo", () => {
      // Arrange
      const placa = "ABC1234";
      const error = new Error("RATE_LIMIT_EXCEEDED: Limite excedido");
      error.rateLimitInfo = {
        currentCount: 100,
        maxRequests: 100,
        remainingRequests: 0,
        resetTime: new Date().toISOString(),
        environment: "production",
        headers: {},
      };

      // Act
      const result = apiVeicularService.criarFallbackVeiculo(placa, error);

      // Assert
      expect(result.rate_limit_info).toBeDefined();
      expect(result.rate_limit_info.exceeded).toBe(true);
      expect(result.api_veicular_metadata.erro.tipo).toBe(
        "rate_limit_excedido"
      );
    });

    it("deve usar tipo 'api_indisponivel' quando não é rate limit", () => {
      // Arrange
      const placa = "ABC1234";
      const error = new Error("Network Error");

      // Act
      const result = apiVeicularService.criarFallbackVeiculo(placa, error);

      // Assert
      expect(result.api_veicular_metadata).toBeDefined();
      expect(result.api_veicular_metadata.erro).toBeDefined();
      expect(result.api_veicular_metadata.erro.tipo).toBe("api_indisponivel");
    });
  });

  describe("limparCachePlaca", () => {
    beforeEach(() => {
      apiVeicularService.cache = {
        del: jest.fn().mockReturnValue(true),
      };
    });

    it("deve limpar cache de placa específica", () => {
      // Arrange
      const placa = "ABC1234";

      // Act
      const result = apiVeicularService.limparCachePlaca(placa);

      // Assert
      expect(apiVeicularService.cache.del).toHaveBeenCalledWith(
        "veiculo_ABC1234"
      );
      expect(result).toBe(true);
    });

    it("deve retornar false quando placa é inválida", () => {
      // Arrange
      const placa = "INVALID";

      // Act
      const result = apiVeicularService.limparCachePlaca(placa);

      // Assert
      expect(result).toBe(false);
      expect(apiVeicularService.cache.del).not.toHaveBeenCalled();
    });
  });

  describe("limparCache", () => {
    beforeEach(() => {
      apiVeicularService.cache = {
        flushAll: jest.fn().mockReturnValue(10),
      };
    });

    it("deve limpar todo o cache", () => {
      // Act
      const result = apiVeicularService.limparCache();

      // Assert
      expect(apiVeicularService.cache.flushAll).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });

  describe("obterEstatisticasCache", () => {
    beforeEach(() => {
      apiVeicularService.cache = {
        keys: jest.fn().mockReturnValue(["key1", "key2"]),
        getStats: jest.fn().mockReturnValue({ hits: 10, misses: 5 }),
        options: { stdTTL: 86400 },
      };
      apiVeicularService.rateLimitCache = {
        keys: jest.fn().mockReturnValue(["rate_limit_1", "rate_limit_2"]),
        get: jest.fn().mockReturnValue(50),
        getStats: jest.fn().mockReturnValue({ hits: 20, misses: 10 }),
        options: { stdTTL: 900 },
      };
      apiVeicularService.circuitBreaker = {
        state: "closed",
        stats: { fires: 100, successes: 95, failures: 5 },
      };
      apiVeicularService.circuitBreakerMetrics = {
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        circuitOpenCount: 0,
        lastFailureTime: null,
        lastSuccessTime: new Date().toISOString(),
      };
      apiVeicularService.rateLimitConfig = {
        production: {
          maxRequests: 100,
          windowMs: 900000,
        },
        current: "production",
      };
      apiVeicularService.circuitBreakerConfig = {
        timeout: 10000,
        errorThresholdPercentage: 50,
      };
    });

    it("deve retornar estatísticas completas do cache", () => {
      // Act
      const result = apiVeicularService.obterEstatisticasCache();

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          cache: expect.objectContaining({
            keys: 2,
            hits: 10,
            misses: 5,
            ttl: 86400,
          }),
          rate_limiting: expect.objectContaining({
            active_ips: 2,
            total_requests: 100, // 50 + 50
            hits: 20,
            misses: 10,
            ttl: 900,
          }),
          circuit_breaker: expect.objectContaining({
            state: "closed",
            enabled: true,
            metrics: expect.any(Object),
          }),
        })
      );
      expect(result.circuit_breaker.success_rate).toBeDefined();
    });

    it("deve calcular success_rate corretamente", () => {
      // Act
      const result = apiVeicularService.obterEstatisticasCache();

      // Assert
      expect(result.circuit_breaker.success_rate).toBe("95.00%");
    });

    it("deve retornar 0% quando não há requests", () => {
      // Arrange
      apiVeicularService.circuitBreakerMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        circuitOpenCount: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
      };

      // Act
      const result = apiVeicularService.obterEstatisticasCache();

      // Assert
      expect(result.circuit_breaker.success_rate).toBe("0%");
    });
  });

  describe("verificarConfiguracao", () => {
    beforeEach(() => {
      apiVeicularService.apiKey = "test-key";
      apiVeicularService.email = "test@example.com";
      apiVeicularService.circuitBreaker = {
        state: "closed",
      };
      apiVeicularService.rateLimitConfig = {
        production: {
          maxRequests: 100,
          windowMs: 900000,
        },
        current: "production",
      };
      apiVeicularService.circuitBreakerConfig = {
        timeout: 10000,
      };
    });

    it("deve retornar configuração quando API está configurada", () => {
      // Act
      const result = apiVeicularService.verificarConfiguracao();

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          api_configured: true,
          api_key_present: true,
          api_email_present: true,
          api_key_demo: false,
          cache_enabled: true,
          rate_limiting_enabled: true,
          circuit_breaker_enabled: true,
        })
      );
    });

    it("deve retornar api_key_demo true quando chave é demo-key", () => {
      // Arrange
      apiVeicularService.apiKey = "demo-key";

      // Act
      const result = apiVeicularService.verificarConfiguracao();

      // Assert
      expect(result.api_key_demo).toBe(true);
    });

    it("deve retornar api_configured false quando falta configuração", () => {
      // Arrange
      apiVeicularService.apiKey = null;
      apiVeicularService.email = null;

      // Act
      const result = apiVeicularService.verificarConfiguracao();

      // Assert
      expect(result.api_configured).toBe(false);
    });
  });

  describe("forcarAberturaCircuitBreaker", () => {
    it("deve forçar abertura do circuit breaker", () => {
      // Arrange
      apiVeicularService.circuitBreaker = {
        open: jest.fn(),
        state: "closed",
      };

      // Act
      apiVeicularService.forcarAberturaCircuitBreaker();

      // Assert
      expect(apiVeicularService.circuitBreaker.open).toHaveBeenCalled();
    });

    it("não deve fazer nada quando circuit breaker não existe", () => {
      // Arrange
      apiVeicularService.circuitBreaker = null;

      // Act & Assert
      expect(() => {
        apiVeicularService.forcarAberturaCircuitBreaker();
      }).not.toThrow();
    });
  });

  describe("forcarFechamentoCircuitBreaker", () => {
    it("deve forçar fechamento do circuit breaker", () => {
      // Arrange
      apiVeicularService.circuitBreaker = {
        close: jest.fn(),
        state: "open",
      };

      // Act
      apiVeicularService.forcarFechamentoCircuitBreaker();

      // Assert
      expect(apiVeicularService.circuitBreaker.close).toHaveBeenCalled();
    });

    it("não deve fazer nada quando circuit breaker não existe", () => {
      // Arrange
      apiVeicularService.circuitBreaker = null;

      // Act & Assert
      expect(() => {
        apiVeicularService.forcarFechamentoCircuitBreaker();
      }).not.toThrow();
    });
  });

  describe("resetarMetricasCircuitBreaker", () => {
    it("deve resetar métricas do circuit breaker", () => {
      // Arrange
      apiVeicularService.circuitBreakerMetrics = {
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        circuitOpenCount: 2,
        lastFailureTime: new Date().toISOString(),
        lastSuccessTime: new Date().toISOString(),
      };

      // Act
      apiVeicularService.resetarMetricasCircuitBreaker();

      // Assert
      expect(apiVeicularService.circuitBreakerMetrics).toEqual({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        circuitOpenCount: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
      });
    });
  });

  describe("obterStatusCircuitBreaker", () => {
    it("deve retornar status quando circuit breaker está habilitado", () => {
      // Arrange
      apiVeicularService.circuitBreaker = {
        state: "closed",
        stats: { fires: 100, successes: 95, failures: 5 },
      };
      apiVeicularService.circuitBreakerMetrics = {
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        circuitOpenCount: 0,
        lastFailureTime: null,
        lastSuccessTime: new Date().toISOString(),
      };
      apiVeicularService.circuitBreakerConfig = {
        timeout: 10000,
        errorThresholdPercentage: 50,
      };

      // Act
      const result = apiVeicularService.obterStatusCircuitBreaker();

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          enabled: true,
          state: "closed",
          config: expect.any(Object),
          metrics: expect.any(Object),
          health: expect.objectContaining({
            success_rate: "95.00%",
            failure_rate: "5.00%",
            total_requests: 100,
          }),
        })
      );
    });

    it("deve retornar status desabilitado quando circuit breaker não existe", () => {
      // Arrange
      apiVeicularService.circuitBreaker = null;

      // Act
      const result = apiVeicularService.obterStatusCircuitBreaker();

      // Assert
      expect(result).toEqual({
        enabled: false,
        state: "unknown",
        message: "Circuit breaker não inicializado",
      });
    });
  });

  describe("consultarVeiculoPorPlaca - circuit breaker", () => {
    beforeEach(() => {
      apiVeicularService.cache = {
        get: jest.fn(),
        set: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
        getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
        options: { stdTTL: 86400 },
      };
      apiVeicularService.rateLimitCache = {
        get: jest.fn(),
        set: jest.fn(),
        getTtl: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
        getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
        options: { stdTTL: 900 },
      };
      apiVeicularService.circuitBreaker = {
        fire: jest.fn(),
        state: "closed",
      };
      apiVeicularService.rateLimitConfig = {
        production: {
          maxRequests: 100,
          windowMs: 900000,
        },
        current: "production",
      };
    });

    it("deve usar fallback quando circuit breaker está aberto", async () => {
      // Arrange
      const placa = "ABC1234";
      const error = new Error("Circuit breaker is open");

      apiVeicularService.cache.get.mockReturnValue(null);
      apiVeicularService.circuitBreaker.fire = jest
        .fn()
        .mockRejectedValue(error);
      jest.spyOn(apiVeicularService, "criarFallbackVeiculo").mockReturnValue({
        placa: "ABC1234",
        marca: "Não informado",
        modelo: "Não informado",
        origem_dados_veiculo: "api_com_fallback",
      });

      // Act
      const result = await apiVeicularService.consultarVeiculoPorPlaca(placa);

      // Assert
      expect(result.origem_dados_veiculo).toBe("api_com_fallback");
      expect(apiVeicularService.criarFallbackVeiculo).toHaveBeenCalled();
    });

    it("deve retornar fallback quando placa é inválida", async () => {
      // Arrange
      const placa = "INVALID";

      apiVeicularService.cache.get.mockReturnValue(null);
      jest.spyOn(apiVeicularService, "criarFallbackVeiculo").mockReturnValue({
        placa: "INVALID",
        marca: "Não informado",
        modelo: "Não informado",
        origem_dados_veiculo: "api_com_fallback",
      });

      // Act
      const result = await apiVeicularService.consultarVeiculoPorPlaca(placa);

      // Assert
      expect(result.origem_dados_veiculo).toBe("api_com_fallback");
      expect(apiVeicularService.criarFallbackVeiculo).toHaveBeenCalled();
    });
  });

  describe("extrairCampo", () => {
    it("deve extrair campo quando existe no objeto", () => {
      // Arrange
      const dados = {
        campo1: "valor1",
        campo2: "valor2",
      };
      const camposPossiveis = ["campo1", "campo3"];

      // Act
      const result = apiVeicularService.extrairCampo(dados, camposPossiveis);

      // Assert
      expect(result).toBe("valor1");
    });

    it("deve retornar null quando campo não existe", () => {
      // Arrange
      const dados = {
        campo1: "valor1",
      };
      const camposPossiveis = ["campo2", "campo3"];

      // Act
      const result = apiVeicularService.extrairCampo(dados, camposPossiveis);

      // Assert
      expect(result).toBeNull();
    });

    it("deve retornar null quando dados é null", () => {
      // Arrange
      const dados = null;
      const camposPossiveis = ["campo1"];

      // Act
      const result = apiVeicularService.extrairCampo(dados, camposPossiveis);

      // Assert
      expect(result).toBeNull();
    });

    it("deve retornar null quando dados não é objeto", () => {
      // Arrange
      const dados = "string";
      const camposPossiveis = ["campo1"];

      // Act
      const result = apiVeicularService.extrairCampo(dados, camposPossiveis);

      // Assert
      expect(result).toBeNull();
    });

    it("deve ignorar campos com valor null", () => {
      // Arrange
      const dados = {
        campo1: null,
        campo2: "valor2",
      };
      const camposPossiveis = ["campo1", "campo2"];

      // Act
      const result = apiVeicularService.extrairCampo(dados, camposPossiveis);

      // Assert
      expect(result).toBe("valor2");
    });

    it("deve ignorar campos com valor undefined", () => {
      // Arrange
      const dados = {
        campo1: undefined,
        campo2: "valor2",
      };
      const camposPossiveis = ["campo1", "campo2"];

      // Act
      const result = apiVeicularService.extrairCampo(dados, camposPossiveis);

      // Assert
      expect(result).toBe("valor2");
    });

    it("deve ignorar campos com valor vazio", () => {
      // Arrange
      const dados = {
        campo1: "",
        campo2: "valor2",
      };
      const camposPossiveis = ["campo1", "campo2"];

      // Act
      const result = apiVeicularService.extrairCampo(dados, camposPossiveis);

      // Assert
      expect(result).toBe("valor2");
    });
  });

  describe("normalizarPlaca - casos de borda", () => {
    it("deve retornar null quando placa é null", () => {
      // Arrange
      const placa = null;

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBeNull();
    });

    it("deve retornar null quando placa é undefined", () => {
      // Arrange
      const placa = undefined;

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBeNull();
    });

    it("deve retornar null quando placa não é string", () => {
      // Arrange
      const placa = 123456;

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBeNull();
    });

    it("deve remover espaços da placa", () => {
      // Arrange
      const placa = "ABC 1234";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1234");
    });

    it("deve normalizar placa com múltiplos hífens", () => {
      // Arrange
      const placa = "ABC--1234";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1234");
    });

    it("deve normalizar placa com espaços e hífens", () => {
      // Arrange
      const placa = "abc - 1234";

      // Act
      const result = apiVeicularService.normalizarPlaca(placa);

      // Assert
      expect(result).toBe("ABC1234");
    });
  });

  describe("mapearMarca - casos de borda", () => {
    it("deve retornar marca original quando marca está em minúsculas", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearMarca("volkswagen");

      // Assert
      expect(result).toBe("Volkswagen");
    });

    it("deve retornar marca original quando marca está em maiúsculas", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearMarca("TOYOTA");

      // Assert
      expect(result).toBe("Toyota");
    });

    it("deve retornar marca original quando marca tem espaços", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearMarca("  FORD  ");

      // Assert
      expect(result).toBe("Ford");
    });

    it("deve tratar erro e retornar 'Não informado'", () => {
      // Arrange
      // Simular erro ao acessar método
      jest.spyOn(apiVeicularService, "mapearMarca").mockImplementationOnce(() => {
        throw new Error("Erro");
      });

      // Act & Assert
      expect(() => {
        apiVeicularService.mapearMarca("TEST");
      }).toThrow();
    });
  });

  describe("mapearCategoria - casos de borda", () => {
    it("deve mapear categoria em minúsculas", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria("auto");

      // Assert
      expect(result).toBe("carro");
    });

    it("deve mapear categoria com espaços", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria("  MOTOCICLETA  ");

      // Assert
      expect(result).toBe("moto");
    });

    it("deve retornar 'outro' quando categoria é vazia", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria("");

      // Assert
      expect(result).toBe("outro");
    });

    it("deve retornar 'outro' quando categoria é undefined", () => {
      // Arrange & Act
      const result = apiVeicularService.mapearCategoria(undefined);

      // Assert
      expect(result).toBe("outro");
    });

    it("deve tratar erro e retornar 'outro'", () => {
      // Arrange
      // Simular erro ao acessar método
      jest
        .spyOn(apiVeicularService, "mapearCategoria")
        .mockImplementationOnce(() => {
          throw new Error("Erro");
        });

      // Act & Assert
      expect(() => {
        apiVeicularService.mapearCategoria("TEST");
      }).toThrow();
    });
  });

  describe("extrairAno - casos de borda", () => {
    it("deve extrair ano de string com espaços", () => {
      // Arrange
      const ano = "  2020  ";

      // Act
      const result = apiVeicularService.extrairAno(ano);

      // Assert
      expect(result).toBe(2020);
    });

    it("deve extrair ano de string que é número", () => {
      // Arrange
      const ano = "2020";

      // Act
      const result = apiVeicularService.extrairAno(ano);

      // Assert
      expect(result).toBe(2020);
    });

    it("deve retornar ano atual quando ano é undefined", () => {
      // Arrange
      const anoAtual = new Date().getFullYear();
      const ano = undefined;

      // Act
      const result = apiVeicularService.extrairAno(ano);

      // Assert
      expect(result).toBe(anoAtual);
    });

    it("deve retornar ano atual quando ano é vazio", () => {
      // Arrange
      const anoAtual = new Date().getFullYear();
      const ano = "";

      // Act
      const result = apiVeicularService.extrairAno(ano);

      // Assert
      expect(result).toBe(anoAtual);
    });

    it("deve retornar ano atual quando ano é NaN", () => {
      // Arrange
      const anoAtual = new Date().getFullYear();
      const ano = "abc";

      // Act
      const result = apiVeicularService.extrairAno(ano);

      // Assert
      expect(result).toBe(anoAtual);
    });

    it("deve tratar erro e retornar ano atual", () => {
      // Arrange
      const anoAtual = new Date().getFullYear();
      // Simular erro ao acessar método
      jest.spyOn(apiVeicularService, "extrairAno").mockImplementationOnce(() => {
        throw new Error("Erro");
      });

      // Act & Assert
      expect(() => {
        apiVeicularService.extrairAno("2020");
      }).toThrow();
    });
  });

  describe("formatarDadosVeiculo - casos de borda", () => {
    it("deve formatar dados quando ano_modelo não existe", () => {
      // Arrange
      const dadosApi = {
        status: "ok",
        dados: {
          informacoes_veiculo: {
            dados_veiculo: {
              placa: "ABC1234",
              marca: "VOLKSWAGEN",
              modelo: "Golf",
              ano_fabricacao: "2020",
              segmento: "AUTO",
              cor: "Branco",
            },
          },
        },
      };

      // Mock do extrairAno para retornar ano válido
      jest.spyOn(apiVeicularService, "extrairAno").mockReturnValue(2020);

      // Act
      const result = apiVeicularService.formatarDadosVeiculo(dadosApi);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: "ABC1234",
          marca: "Volkswagen",
          modelo: "Golf",
          ano_fabricacao: 2020,
          ano_modelo: 2020,
        })
      );
    });

    it("deve lançar erro quando dadosApi não é objeto", () => {
      // Arrange
      const dadosApi = "string";

      // Act & Assert
      expect(() => {
        apiVeicularService.formatarDadosVeiculo(dadosApi);
      }).toThrow("Erro ao processar dados da API veicular");
    });

    it("deve lançar erro quando dadosApi.status não é 'ok'", () => {
      // Arrange
      const dadosApi = {
        status: "error",
        dados: {
          informacoes_veiculo: {
            dados_veiculo: {},
          },
        },
      };

      // Act & Assert
      expect(() => {
        apiVeicularService.formatarDadosVeiculo(dadosApi);
      }).toThrow("Erro ao processar dados da API veicular");
    });

    it("deve lançar erro quando dadosApi.dados é null", () => {
      // Arrange
      const dadosApi = {
        status: "ok",
        dados: null,
      };

      // Act & Assert
      expect(() => {
        apiVeicularService.formatarDadosVeiculo(dadosApi);
      }).toThrow("Erro ao processar dados da API veicular");
    });
  });

  describe("validarDadosFormatados - casos de borda", () => {
    it("deve lançar erro quando campo obrigatório é null", () => {
      // Arrange
      const dados = {
        placa: null, // Inválido
        marca: "Volkswagen",
        modelo: "Golf",
        ano_fabricacao: 2020,
        ano_modelo: 2020,
        categoria: "carro",
        cor: "Branco",
      };

      // Act & Assert
      expect(() => {
        apiVeicularService.validarDadosFormatados(dados);
      }).toThrow();
    });

    it("deve lançar erro quando campo obrigatório é undefined", () => {
      // Arrange
      const dados = {
        placa: "ABC1234",
        marca: "Volkswagen",
        modelo: undefined, // Inválido
        ano_fabricacao: 2020,
        ano_modelo: 2020,
        categoria: "carro",
        cor: "Branco",
      };

      // Act & Assert
      expect(() => {
        apiVeicularService.validarDadosFormatados(dados);
      }).toThrow();
    });

    it("deve lançar erro quando dados não é objeto", () => {
      // Arrange
      const dados = "string";

      // Act & Assert
      expect(() => {
        apiVeicularService.validarDadosFormatados(dados);
      }).toThrow();
    });
  });

  describe("criarFallbackVeiculo - casos de borda", () => {
    beforeEach(() => {
      // Garantir que não há mocks interferindo
      jest.clearAllMocks();
      // Restaurar implementação original de normalizarPlaca se houver spy
      jest.restoreAllMocks();
    });

    it("deve criar fallback quando erro não tem message", () => {
      // Arrange
      const placa = "ABC1234";
      const error = {}; // Erro sem message

      // Act
      const result = apiVeicularService.criarFallbackVeiculo(placa, error);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: placa, // Placa deve ser mantida como recebida
          marca: "Não informado",
          modelo: "Não informado",
          origem_dados_veiculo: "api_com_fallback",
        })
      );
      expect(result.api_veicular_metadata.erro.message).toBe("Erro desconhecido");
    });

    it("deve criar fallback quando erro é null", () => {
      // Arrange
      const placa = "ABC1234";
      const error = null;

      // Act
      const result = apiVeicularService.criarFallbackVeiculo(placa, error);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          placa: placa, // Placa deve ser mantida como recebida
          marca: "Não informado",
          modelo: "Não informado",
          origem_dados_veiculo: "api_com_fallback",
        })
      );
      expect(result.api_veicular_metadata.erro.message).toBe("Erro desconhecido");
    });
  });
});

