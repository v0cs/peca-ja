const AuthController = require("../../../src/controllers/authController");
const { Usuario, Cliente, Autopeca } = require("../../../src/models");

jest.mock("../../../src/models", () => ({
  Usuario: {
    sequelize: {
      transaction: jest.fn(),
    },
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Cliente: {
    create: jest.fn(),
  },
  Autopeca: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../../src/config/env", () => ({
  frontendURL: "http://localhost:5173",
  JWT_SECRET: "test-secret",
  JWT_EXPIRES_IN: "24h",
}));

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("AuthController - Validações Auxiliares", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    Usuario.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
  });

  describe("Validação de UF", () => {
    it("deve rejeitar UF inválida", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "123456",
        celular: "(11)99999-9999",
        cidade: "São Paulo",
        uf: "XX", // UF inválida
      };

      Usuario.findOne.mockResolvedValue(null);

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("deve aceitar UF válida", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "123456",
        celular: "(11)99999-9999",
        cidade: "São Paulo",
        uf: "SP",
      };

      Usuario.findOne.mockResolvedValue(null);
      const bcrypt = require("bcryptjs");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

      const mockUsuario = { id: 1, email: "joao@teste.com", tipo_usuario: "cliente" };
      const mockCliente = { id: 1, nome_completo: "João Silva" };

      Usuario.create.mockResolvedValue(mockUsuario);
      Cliente.create.mockResolvedValue(mockCliente);

      await AuthController.register(req, res);

      // Se não retornou erro 400, a UF foi aceita
      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });

  describe("Validação de Celular", () => {
    it("deve rejeitar celular com menos de 11 dígitos", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "123456",
        celular: "1199999999", // 10 dígitos
        cidade: "São Paulo",
        uf: "SP",
      };

      Usuario.findOne.mockResolvedValue(null);

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("deve aceitar celular com 11 dígitos", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "123456",
        celular: "(11)99999-9999",
        cidade: "São Paulo",
        uf: "SP",
      };

      Usuario.findOne.mockResolvedValue(null);
      const bcrypt = require("bcryptjs");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

      const mockUsuario = { id: 1, email: "joao@teste.com", tipo_usuario: "cliente" };
      const mockCliente = { id: 1, nome_completo: "João Silva" };

      Usuario.create.mockResolvedValue(mockUsuario);
      Cliente.create.mockResolvedValue(mockCliente);

      await AuthController.register(req, res);

      // Se não retornou erro 400, o celular foi aceito
      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });

  describe("Validação de Email", () => {
    it("deve rejeitar email inválido", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "email-invalido", // Email sem @
        senha: "123456",
        celular: "(11)99999-9999",
        cidade: "São Paulo",
        uf: "SP",
      };

      Usuario.findOne.mockResolvedValue(null);

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("deve aceitar email válido", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "123456",
        celular: "(11)99999-9999",
        cidade: "São Paulo",
        uf: "SP",
      };

      Usuario.findOne.mockResolvedValue(null);
      const bcrypt = require("bcryptjs");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

      const mockUsuario = { id: 1, email: "joao@teste.com", tipo_usuario: "cliente" };
      const mockCliente = { id: 1, nome_completo: "João Silva" };

      Usuario.create.mockResolvedValue(mockUsuario);
      Cliente.create.mockResolvedValue(mockCliente);

      await AuthController.register(req, res);

      // Se não retornou erro 400, o email foi aceito
      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });

  describe("Validação de Senha", () => {
    it("deve rejeitar senha muito curta", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "12345", // Menos de 6 caracteres
        celular: "(11)99999-9999",
        cidade: "São Paulo",
        uf: "SP",
      };

      Usuario.findOne.mockResolvedValue(null);

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("deve aceitar senha com 6 ou mais caracteres", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "123456",
        celular: "(11)99999-9999",
        cidade: "São Paulo",
        uf: "SP",
      };

      Usuario.findOne.mockResolvedValue(null);
      const bcrypt = require("bcryptjs");
      bcrypt.hash = jest.fn().mockResolvedValue("hashedPassword");

      const mockUsuario = { id: 1, email: "joao@teste.com", tipo_usuario: "cliente" };
      const mockCliente = { id: 1, nome_completo: "João Silva" };

      Usuario.create.mockResolvedValue(mockUsuario);
      Cliente.create.mockResolvedValue(mockCliente);

      await AuthController.register(req, res);

      // Se não retornou erro 400, a senha foi aceita
      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });
});

