const authMiddleware = require("../../../src/middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const config = require("../../../src/config/env");

// Mock do jwt
jest.mock("jsonwebtoken");

// Mock do config
jest.mock("../../../src/config/env", () => ({
  JWT_SECRET: "test-secret-key",
}));

describe("authMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("Validação de Token", () => {
    it("deve retornar 401 quando Authorization header não é fornecido", () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token de acesso não fornecido",
        errors: {
          authorization: "Header Authorization é obrigatório",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 401 quando formato do token está incorreto", () => {
      req.headers.authorization = "InvalidFormat token123";

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Formato de token inválido",
        errors: {
          authorization: "Formato esperado: Bearer <token>",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("deve retornar 401 quando token está ausente", () => {
      req.headers.authorization = "Bearer";

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve chamar next() quando token é válido", (done) => {
      const mockUser = { userId: 1, tipo: "cliente" };
      req.headers.authorization = "Bearer valid-token";
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      authMiddleware(req, res, next);

      // jwt.verify é assíncrono, então precisamos aguardar
      setTimeout(() => {
        expect(jwt.verify).toHaveBeenCalledWith(
          "valid-token",
          "test-secret-key",
          expect.any(Function)
        );
        expect(req.user).toEqual({ userId: 1, tipo: "cliente" });
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    it("deve retornar 401 quando token é inválido", (done) => {
      req.headers.authorization = "Bearer invalid-token";
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error("Token inválido"), null);
      });

      authMiddleware(req, res, next);

      setTimeout(() => {
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: "Token inválido",
          errors: {
            token: "Token de acesso inválido ou malformado",
          },
        });
        expect(next).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    it("deve retornar 401 quando token está expirado", (done) => {
      req.headers.authorization = "Bearer expired-token";
      const expiredError = new Error("Token expirado");
      expiredError.name = "TokenExpiredError";
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(expiredError, null);
      });

      authMiddleware(req, res, next);

      setTimeout(() => {
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: "Token expirado",
          errors: {
            token: "Seu token de acesso expirou. Faça login novamente.",
          },
        });
        expect(next).not.toHaveBeenCalled();
        done();
      }, 10);
    });
  });
});

