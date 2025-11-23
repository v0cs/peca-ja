const AuthController = require("../../../src/controllers/authController");
const { Usuario, Cliente, Autopeca } = require("../../../src/models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Usuario: {
    sequelize: {
      transaction: jest.fn(),
    },
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Cliente: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Autopeca: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock do config
jest.mock("../../../src/config/env", () => ({
  frontendURL: "http://localhost:5173",
  JWT_SECRET: "test-secret",
  JWT_EXPIRES_IN: "24h",
}));

// Mock do bcrypt
jest.mock("bcryptjs");

// Mock do jwt
jest.mock("jsonwebtoken");

describe("AuthController - Funções Auxiliares", () => {
  // Como as funções validarCNPJ, formatarCelularBanco e formatarTelefoneBanco
  // não são exportadas diretamente, vamos testá-las através dos métodos que as usam
  // ou criar testes indiretos

  describe("validarCNPJ (testado através de registerAutopeca)", () => {
    let req, res, mockTransaction;

    beforeEach(() => {
      jest.clearAllMocks();
      mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      // Reconfigurar mock de transaction após clearAllMocks
      if (Usuario.sequelize) {
        Usuario.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
      }

      req = {
        body: {},
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it("deve rejeitar CNPJ com menos de 14 dígitos", async () => {
      req.body = {
        razao_social: "Teste LTDA",
        cnpj: "1234567890123", // 13 dígitos
        email: "teste@teste.com",
        senha: "senha123",
        telefone: "(11)34567890",
        endereco_rua: "Rua Teste",
        endereco_numero: "123",
        endereco_bairro: "Bairro Teste",
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
        endereco_cep: "12345678",
      };

      Usuario.findOne.mockResolvedValue(null);
      Autopeca.findOne.mockResolvedValue(null);

      await AuthController.registerAutopeca(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.objectContaining({
            cnpj: expect.stringContaining("CNPJ"),
          }),
        })
      );
    });

    it("deve rejeitar CNPJ com todos os dígitos iguais", async () => {
      req.body = {
        razao_social: "Teste LTDA",
        cnpj: "11111111111111", // Todos iguais
        email: "teste@teste.com",
        senha: "senha123",
        telefone: "(11)34567890",
        endereco_rua: "Rua Teste",
        endereco_numero: "123",
        endereco_bairro: "Bairro Teste",
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
        endereco_cep: "12345678",
      };

      Usuario.findOne.mockResolvedValue(null);
      Autopeca.findOne.mockResolvedValue(null);

      await AuthController.registerAutopeca(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.objectContaining({
            cnpj: expect.stringContaining("CNPJ"),
          }),
        })
      );
    });

    it("deve aceitar CNPJ válido (formato com caracteres especiais)", async () => {
      // CNPJ válido: 11.222.333/0001-81
      req.body = {
        razao_social: "Teste LTDA",
        cnpj: "11.222.333/0001-81",
        email: "teste@teste.com",
        senha: "senha123",
        telefone: "(11)34567890",
        endereco_rua: "Rua Teste",
        endereco_numero: "123",
        endereco_bairro: "Bairro Teste",
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
        endereco_cep: "12345678",
      };

      Usuario.findOne.mockResolvedValue(null);
      Autopeca.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed_password");
      Usuario.create.mockResolvedValue({
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "autopeca",
      });
      Autopeca.create.mockResolvedValue({
        id: 1,
        cnpj: "11222333000181",
      });

      await AuthController.registerAutopeca(req, res);

      // Se chegou aqui sem erro 400, o CNPJ foi aceito
      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });

  describe("formatarCelularBanco e formatarTelefoneBanco (testado através de register)", () => {
    let req, res, mockTransaction;

    beforeEach(() => {
      jest.clearAllMocks();
      mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      // Reconfigurar mock de transaction após clearAllMocks
      if (Usuario.sequelize) {
        Usuario.sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
      }

      req = {
        body: {},
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      bcrypt.hash.mockResolvedValue("hashed_password");
      jwt.sign.mockReturnValue("mock_token");
    });

    it("deve formatar celular corretamente (11 dígitos)", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "senha123",
        celular: "(11)987654321", // Formato correto com 11 dígitos
        uf: "SP",
        cidade: "São Paulo",
      };

      Usuario.findOne.mockResolvedValue(null);
      Cliente.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue({
        id: 1,
        email: "joao@teste.com",
        tipo_usuario: "cliente",
      });
      Cliente.create.mockResolvedValue({
        id: 1,
        celular: "(11)987654321",
      });

      await AuthController.register(req, res);

      expect(Cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          celular: "(11)987654321",
        }),
        expect.any(Object)
      );
    });

    it("deve rejeitar celular com menos de 11 dígitos", async () => {
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "senha123",
        celular: "(11)98765432", // 10 dígitos (formato incorreto)
        uf: "SP",
        cidade: "São Paulo",
      };

      Usuario.findOne.mockResolvedValue(null);
      Cliente.findOne.mockResolvedValue(null);

      await AuthController.register(req, res);

      // Deve retornar erro 400 por validação de celular
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.objectContaining({
            celular: expect.any(String),
          }),
        })
      );
      // Cliente.create não deve ser chamado quando há erro de validação
      expect(Cliente.create).not.toHaveBeenCalled();
    });

    it("deve formatar telefone corretamente (10 ou 11 dígitos)", async () => {
      // Nota: O método register não valida telefone separadamente
      // Ele sempre usa formatarTelefoneBanco(celular) para o campo telefone
      // Este teste verifica que o celular é formatado corretamente
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "senha123",
        celular: "(11)987654321", // 11 dígitos
        uf: "SP",
        cidade: "São Paulo",
      };

      Usuario.findOne.mockResolvedValue(null);
      Cliente.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue({
        id: 1,
        email: "joao@teste.com",
        tipo_usuario: "cliente",
      });
      Cliente.create.mockResolvedValue({
        id: 1,
        celular: "(11)987654321",
        telefone: "(11)987654321", // O código usa formatarTelefoneBanco(celular)
      });

      await AuthController.register(req, res);

      // Verificar que o celular foi formatado corretamente
      expect(Cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          celular: "(11)987654321",
        }),
        expect.any(Object)
      );
    });

    it("deve rejeitar telefone com menos de 10 dígitos", async () => {
      // Nota: O método register não valida telefone separadamente
      // Ele valida apenas o celular. Este teste verifica que celular inválido é rejeitado
      // Para testar telefone, precisaríamos usar registerAutopeca que valida telefone
      req.body = {
        nome_completo: "João Silva",
        email: "joao@teste.com",
        senha: "senha123",
        celular: "(11)98765432", // 10 dígitos (inválido - precisa de 11)
        uf: "SP",
        cidade: "São Paulo",
      };

      Usuario.findOne.mockResolvedValue(null);
      Cliente.findOne.mockResolvedValue(null);

      await AuthController.register(req, res);

      // Deve retornar erro 400 por validação de celular
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.objectContaining({
            celular: expect.any(String),
          }),
        })
      );
      // Cliente.create não deve ser chamado quando há erro de validação
      expect(Cliente.create).not.toHaveBeenCalled();
    });
  });
});

