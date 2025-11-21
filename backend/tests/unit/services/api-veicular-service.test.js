const ApiVeicularService = require("../../../src/services/apiVeicularService");
const axios = require("axios");
const NodeCache = require("node-cache");

// Mock do axios
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
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

describe("ApiVeicularService", () => {
  let apiVeicularService;
  let mockAxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = {
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
    axios.create.mockReturnValue(mockAxiosInstance);
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
});

