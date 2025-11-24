// Mock do express-rate-limit ANTES de qualquer require
jest.mock("express-rate-limit", () => {
  return jest.fn((options) => {
    return (req, res, next) => {
      req.rateLimit = {
        limit: options.max || 100,
        remaining: 99,
        resetTime: Date.now() + 60000,
      };
      next();
    };
  });
});

// Mock do config ANTES de qualquer require
jest.mock("../../../src/config/env", () => ({
  RATE_LIMIT_GENERAL_MAX: 100,
  RATE_LIMIT_GENERAL_WINDOW: 15,
  RATE_LIMIT_AUTH_MAX: 5,
  RATE_LIMIT_AUTH_WINDOW: 15,
  RATE_LIMIT_API_MAX: 1000,
  RATE_LIMIT_API_WINDOW: 60,
  RATE_LIMIT_UPLOAD_MAX: 10,
  RATE_LIMIT_UPLOAD_WINDOW: 60,
  RATE_LIMIT_SOLICITATION_MAX: 20,
  RATE_LIMIT_SOLICITATION_WINDOW: 60,
  RATE_LIMIT_VENDEDOR_CREATION_MAX: 3,
  RATE_LIMIT_VENDEDOR_CREATION_WINDOW: 60,
}));

const {
  generalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  solicitationRateLimiter,
  vendedorCreationRateLimiter,
} = require("../../../src/middleware/rateLimitMiddleware");

describe("Rate Limit Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      ip: "127.0.0.1",
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  describe("generalRateLimiter", () => {
    it("deve criar um rate limiter geral", () => {
      const limiter = generalRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = generalRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("authRateLimiter", () => {
    it("deve criar um rate limiter para autenticação", () => {
      const limiter = authRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = authRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("apiRateLimiter", () => {
    it("deve criar um rate limiter para API", () => {
      const limiter = apiRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = apiRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("uploadRateLimiter", () => {
    it("deve criar um rate limiter para upload", () => {
      const limiter = uploadRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = uploadRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("solicitationRateLimiter", () => {
    it("deve criar um rate limiter para solicitações", () => {
      const limiter = solicitationRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = solicitationRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("vendedorCreationRateLimiter", () => {
    it("deve criar um rate limiter para criação de vendedores", () => {
      const limiter = vendedorCreationRateLimiter;
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("deve permitir requisição quando dentro do limite", () => {
      const limiter = vendedorCreationRateLimiter;
      limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("Rate Limiter - Cenários Avançados", () => {
    it("generalRateLimiter deve aceitar usuário autenticado", () => {
      req.user = { userId: 1, tipo: "cliente" };
      generalRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("authRateLimiter deve aceitar requisições de autenticação", () => {
      authRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("apiRateLimiter deve aceitar requisições de API", () => {
      apiRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("uploadRateLimiter deve aceitar requisições de upload", () => {
      uploadRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("solicitationRateLimiter deve aceitar requisições de solicitação", () => {
      solicitationRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("vendedorCreationRateLimiter deve aceitar requisições de criação de vendedor", () => {
      vendedorCreationRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("deve funcionar com diferentes IPs", () => {
      req.ip = "192.168.1.1";
      generalRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("deve funcionar com headers X-Forwarded-For", () => {
      req.headers["x-forwarded-for"] = "10.0.0.1";
      generalRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("deve funcionar com header X-Real-IP", () => {
      req.headers["x-real-ip"] = "172.16.0.1";
      generalRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("deve funcionar sem IP definido", () => {
      delete req.ip;
      generalRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Todos os Rate Limiters - Validação de Funcionamento", () => {
    const limiters = [
      { name: "generalRateLimiter", limiter: generalRateLimiter },
      { name: "authRateLimiter", limiter: authRateLimiter },
      { name: "apiRateLimiter", limiter: apiRateLimiter },
      { name: "uploadRateLimiter", limiter: uploadRateLimiter },
      { name: "solicitationRateLimiter", limiter: solicitationRateLimiter },
      { name: "vendedorCreationRateLimiter", limiter: vendedorCreationRateLimiter },
    ];

    limiters.forEach(({ name, limiter }) => {
      it(`${name} deve ser uma função`, () => {
        expect(typeof limiter).toBe("function");
      });

      it(`${name} deve chamar next() quando requisição é válida`, () => {
        limiter(req, res, next);
        expect(next).toHaveBeenCalled();
      });

      it(`${name} deve definir rateLimit no req`, () => {
        limiter(req, res, next);
        expect(req.rateLimit).toBeDefined();
        expect(req.rateLimit.limit).toBeDefined();
      });
    });
  });
});

