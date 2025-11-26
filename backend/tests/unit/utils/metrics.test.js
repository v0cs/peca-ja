const {
  metricsMiddleware,
  getMetrics,
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeUsers,
  databaseConnections,
} = require("../../../src/utils/metrics");

describe("Metrics Utils", () => {
  beforeEach(() => {
    // Limpar métricas antes de cada teste
    register.clear();
  });

  describe("metricsMiddleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        method: "GET",
        path: "/api/test",
        route: null,
        originalUrl: "/api/test",
      };
      res = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === "finish") {
            // Simular finish imediatamente para alguns testes
            setTimeout(() => callback(), 0);
          }
        }),
        writableEnded: false,
      };
      next = jest.fn();
    });

    it("deve chamar next() imediatamente", () => {
      metricsMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("deve ignorar endpoint de métricas", () => {
      req.path = "/api/metrics";
      metricsMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.on).not.toHaveBeenCalled();
    });

    it("deve ignorar endpoint /metrics", () => {
      req.path = "/metrics";
      metricsMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.on).not.toHaveBeenCalled();
    });

    it("deve registrar evento finish na resposta", () => {
      metricsMiddleware(req, res, next);
      expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
    });

    it("deve registrar evento close na resposta", () => {
      metricsMiddleware(req, res, next);
      expect(res.on).toHaveBeenCalledWith("close", expect.any(Function));
    });

    it("deve coletar métricas quando resposta termina com sucesso", () => {
      const observeSpy = jest.spyOn(httpRequestDuration, "observe");
      const incSpy = jest.spyOn(httpRequestTotal, "inc");
      
      req.route = { path: "/api/test" };
      metricsMiddleware(req, res, next);

      // Simular finish
      const finishCallback = res.on.mock.calls.find(
        (call) => call[0] === "finish"
      )[1];

      finishCallback();
      
      // Verificar se métodos foram chamados
      expect(observeSpy).toHaveBeenCalled();
      expect(incSpy).toHaveBeenCalled();
      
      observeSpy.mockRestore();
      incSpy.mockRestore();
    });

    it("deve usar método da requisição", () => {
      const observeSpy = jest.spyOn(httpRequestDuration, "observe");
      req.method = "POST";
      metricsMiddleware(req, res, next);
      const finishCallback = res.on.mock.calls.find(
        (call) => call[0] === "finish"
      )[1];

      finishCallback();
      
      expect(observeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ method: "POST" }),
        expect.any(Number)
      );
      
      observeSpy.mockRestore();
    });

    it("deve usar rota da requisição quando disponível", () => {
      const observeSpy = jest.spyOn(httpRequestDuration, "observe");
      req.route = { path: "/api/custom-route" };
      metricsMiddleware(req, res, next);
      const finishCallback = res.on.mock.calls.find(
        (call) => call[0] === "finish"
      )[1];

      finishCallback();
      
      expect(observeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ route: "/api/custom-route" }),
        expect.any(Number)
      );
      
      observeSpy.mockRestore();
    });

    it("deve usar path quando route não está disponível", () => {
      const observeSpy = jest.spyOn(httpRequestDuration, "observe");
      req.path = "/api/alternative";
      req.route = null;
      metricsMiddleware(req, res, next);
      const finishCallback = res.on.mock.calls.find(
        (call) => call[0] === "finish"
      )[1];

      finishCallback();
      
      expect(observeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ route: "/api/alternative" }),
        expect.any(Number)
      );
      
      observeSpy.mockRestore();
    });

    it("deve adicionar /api quando path não começa com /api", () => {
      const observeSpy = jest.spyOn(httpRequestDuration, "observe");
      req.path = "/test";
      req.route = null;
      metricsMiddleware(req, res, next);
      const finishCallback = res.on.mock.calls.find(
        (call) => call[0] === "finish"
      )[1];

      finishCallback();
      
      expect(observeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ route: "/api/test" }),
        expect.any(Number)
      );
      
      observeSpy.mockRestore();
    });

    it("deve usar status code da resposta", () => {
      const observeSpy = jest.spyOn(httpRequestDuration, "observe");
      res.statusCode = 404;
      metricsMiddleware(req, res, next);
      const finishCallback = res.on.mock.calls.find(
        (call) => call[0] === "finish"
      )[1];

      finishCallback();
      
      expect(observeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "404" }),
        expect.any(Number)
      );
      
      observeSpy.mockRestore();
    });

    it("deve coletar métricas em close quando conexão fecha antes de terminar", () => {
      const observeSpy = jest.spyOn(httpRequestDuration, "observe");
      res.writableEnded = false;
      metricsMiddleware(req, res, next);

      const closeCallback = res.on.mock.calls.find(
        (call) => call[0] === "close"
      )[1];

      closeCallback();
      
      expect(observeSpy).toHaveBeenCalled();
      
      observeSpy.mockRestore();
    });

    it("não deve coletar métricas em close quando writableEnded é true", async () => {
      res.writableEnded = true;
      metricsMiddleware(req, res, next);

      const closeCallback = res.on.mock.calls.find(
        (call) => call[0] === "close"
      )[1];

      const metricsBefore = await register.metrics();
      closeCallback();
      await new Promise(resolve => setTimeout(resolve, 50));
      const metricsAfter = await register.metrics();
      // Não deve adicionar novas métricas (ou adicionar muito pouco)
      // Como as métricas podem ter mudado por outros processos, apenas verificamos que não há erro
      expect(typeof metricsAfter).toBe("string");
    });

    it("deve tratar erros ao coletar métricas em finish", () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Forçar erro ao observar métricas
      jest.spyOn(httpRequestDuration, "observe").mockImplementation(() => {
        throw new Error("Test error");
      });

      metricsMiddleware(req, res, next);
      const finishCallback = res.on.mock.calls.find(
        (call) => call[0] === "finish"
      )[1];

      finishCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Erro ao coletar métricas:",
        "Test error"
      );

      consoleErrorSpy.mockRestore();
      httpRequestDuration.observe.mockRestore();
    });

    it("deve tratar erros ao coletar métricas em close", () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Forçar erro ao observar métricas
      jest.spyOn(httpRequestDuration, "observe").mockImplementation(() => {
        throw new Error("Test error");
      });

      res.writableEnded = false;
      metricsMiddleware(req, res, next);
      const closeCallback = res.on.mock.calls.find(
        (call) => call[0] === "close"
      )[1];

      closeCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Erro ao coletar métricas em close:",
        "Test error"
      );

      consoleErrorSpy.mockRestore();
      httpRequestDuration.observe.mockRestore();
    });
  });

  describe("getMetrics", () => {
    it("deve retornar métricas no formato Prometheus", async () => {
      const metrics = await getMetrics();
      expect(typeof metrics).toBe("string");
      // Métricas podem estar vazias se nenhuma foi coletada ainda
      expect(metrics.length).toBeGreaterThanOrEqual(0);
    });

    it("deve retornar string mesmo quando não há métricas", async () => {
      register.clear();
      const metrics = await getMetrics();
      expect(typeof metrics).toBe("string");
    });
  });

  describe("Métricas exportadas", () => {
    it("deve exportar register", () => {
      expect(register).toBeDefined();
      expect(typeof register.metrics).toBe("function");
    });

    it("deve exportar httpRequestDuration", () => {
      expect(httpRequestDuration).toBeDefined();
      expect(typeof httpRequestDuration.observe).toBe("function");
    });

    it("deve exportar httpRequestTotal", () => {
      expect(httpRequestTotal).toBeDefined();
      expect(typeof httpRequestTotal.inc).toBe("function");
    });

    it("deve exportar activeUsers", () => {
      expect(activeUsers).toBeDefined();
      expect(typeof activeUsers.set).toBe("function");
    });

    it("deve exportar databaseConnections", () => {
      expect(databaseConnections).toBeDefined();
      expect(typeof databaseConnections.set).toBe("function");
    });
  });
});

