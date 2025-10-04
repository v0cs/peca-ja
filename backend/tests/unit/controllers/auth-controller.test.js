const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthController = require("../../../src/controllers/authController");
const { Usuario, Cliente, Autopeca } = require("../../../src/models");

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Usuario: {
    sequelize: {
      transaction: jest.fn(() => ({
        commit: jest.fn(),
        rollback: jest.fn(),
      })),
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

// Mock do bcrypt
jest.mock("bcryptjs");

// Mock do jwt
jest.mock("jsonwebtoken");

describe("AuthController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    req = {
      body: {},
    };

    // Mock response
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock transaction
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    Usuario.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe("register", () => {
    const validClienteData = {
      nome_completo: "João Silva",
      email: "joao@teste.com",
      senha: "123456",
      celular: "(11)99999-9999",
      cidade: "São Paulo",
      uf: "SP",
    };

    beforeEach(() => {
      req.body = validClienteData;
    });

    it("deve registrar um cliente com sucesso", async () => {
      // Arrange
      Usuario.findOne.mockResolvedValue(null); // Email não existe
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const mockUsuario = {
        id: 1,
        email: "joao@teste.com",
        tipo_usuario: "cliente",
      };
      const mockCliente = { id: 1, nome_completo: "João Silva" };

      Usuario.create.mockResolvedValue(mockUsuario);
      Cliente.create.mockResolvedValue(mockCliente);

      // Act
      await AuthController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Cliente registrado com sucesso",
        data: expect.objectContaining({
          usuario: expect.objectContaining({
            id: 1,
            email: "joao@teste.com",
            tipo_usuario: "cliente",
          }),
          cliente: expect.objectContaining({
            id: 1,
            nome_completo: "João Silva",
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando email já existe", async () => {
      // Arrange
      Usuario.findOne.mockResolvedValue({ id: 1, email: "joao@teste.com" });

      // Act
      await AuthController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email já cadastrado",
        errors: {
          email: "Este email já está sendo usado por outro usuário",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando campos obrigatórios estão faltando", async () => {
      // Arrange
      req.body = { email: "joao@teste.com" }; // Campos faltando

      // Act
      await AuthController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Campos obrigatórios não fornecidos",
        errors: expect.objectContaining({
          campos_faltando: expect.arrayContaining([
            "nome_completo",
            "senha",
            "celular",
            "cidade",
            "uf",
          ]),
        }),
      });
    });

    it("deve retornar erro para email inválido", async () => {
      // Arrange
      req.body = { ...validClienteData, email: "email-invalido" };

      // Act
      await AuthController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          email: "Formato de email inválido",
        },
      });
    });

    it("deve retornar erro para senha muito curta", async () => {
      // Arrange
      req.body = { ...validClienteData, senha: "123" };

      // Act
      await AuthController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          senha: "A senha deve ter pelo menos 6 caracteres",
        },
      });
    });

    it("deve retornar erro para celular inválido", async () => {
      // Arrange
      req.body = { ...validClienteData, celular: "11999999999" };

      // Act
      await AuthController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          celular: "Formato de celular inválido. Use o formato: (11)999999999",
        },
      });
    });

    it("deve retornar erro para UF inválida", async () => {
      // Arrange
      req.body = { ...validClienteData, uf: "XX" };

      // Act
      await AuthController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          uf: "UF inválida",
        },
      });
    });
  });

  describe("registerAutopeca", () => {
    const validAutopecaData = {
      email: "autopeca@teste.com",
      senha: "123456",
      razao_social: "Auto Peças LTDA",
      nome_fantasia: "Auto Peças Silva",
      cnpj: "11222333000181",
      telefone: "(11)99999-9999",
      endereco_rua: "Rua das Flores",
      endereco_numero: "123",
      endereco_bairro: "Centro",
      endereco_cidade: "São Paulo",
      endereco_uf: "SP",
      endereco_cep: "01234567",
    };

    beforeEach(() => {
      req.body = validAutopecaData;
    });

    it("deve registrar uma autopeça com sucesso", async () => {
      // Arrange
      Usuario.findOne.mockResolvedValue(null); // Email não existe
      Autopeca.findOne.mockResolvedValue(null); // CNPJ não existe
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const mockUsuario = {
        id: 1,
        email: "autopeca@teste.com",
        tipo_usuario: "autopeca",
        ativo: true,
        termos_aceitos: true,
        data_aceite_terms: new Date(),
      };
      const mockAutopeca = {
        id: 1,
        razao_social: "Auto Peças LTDA",
        nome_fantasia: "Auto Peças Silva",
        cnpj: "11222333000181",
        telefone: "(11)99999-9999",
        endereco_rua: "Rua das Flores",
        endereco_numero: "123",
        endereco_bairro: "Centro",
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
        endereco_cep: "01234567",
      };

      Usuario.create.mockResolvedValue(mockUsuario);
      Autopeca.create.mockResolvedValue(mockAutopeca);

      // Act
      await AuthController.registerAutopeca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Autopeça registrada com sucesso",
        data: expect.objectContaining({
          usuario: expect.objectContaining({
            id: 1,
            email: "autopeca@teste.com",
            tipo_usuario: "autopeca",
            ativo: true,
            termos_aceitos: true,
          }),
          autopeca: expect.objectContaining({
            id: 1,
            razao_social: "Auto Peças LTDA",
            nome_fantasia: "Auto Peças Silva",
            cnpj: "11222333000181",
          }),
        }),
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("deve retornar erro quando CNPJ já existe", async () => {
      // Arrange
      Usuario.findOne.mockResolvedValue(null); // Email não existe
      Autopeca.findOne.mockResolvedValue({ id: 1, cnpj: "11222333000181" }); // CNPJ existe

      // Act
      await AuthController.registerAutopeca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "CNPJ já cadastrado",
        errors: {
          cnpj: "Este CNPJ já está sendo usado por outra autopeça",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro para CNPJ inválido", async () => {
      // Arrange
      req.body = { ...validAutopecaData, cnpj: "12345678901234" }; // CNPJ inválido

      // Act
      await AuthController.registerAutopeca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: {
          cnpj: "CNPJ inválido",
        },
      });
    });

    it("deve retornar erro para CEP inválido", async () => {
      // Arrange
      req.body = { ...validAutopecaData, endereco_cep: "12345" }; // CEP inválido

      // Act
      await AuthController.registerAutopeca(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: expect.objectContaining({
          endereco_cep: "CEP deve conter exatamente 8 dígitos numéricos",
        }),
      });
    });
  });

  describe("login", () => {
    const validLoginData = {
      email: "teste@teste.com",
      senha: "123456",
    };

    beforeEach(() => {
      req.body = validLoginData;
    });

    it("deve fazer login com sucesso para cliente", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "cliente",
        ativo: true,
        senha_hash: "hashedPassword",
        cliente: {
          id: 1,
          nome_completo: "João Silva",
          celular: "(11)99999-9999",
          cidade: "São Paulo",
          uf: "SP",
        },
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("jwt-token");

      // Act
      await AuthController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Login realizado com sucesso",
        data: expect.objectContaining({
          token: "jwt-token",
          usuario: expect.objectContaining({
            id: 1,
            email: "teste@teste.com",
            tipo_usuario: "cliente",
          }),
          cliente: expect.objectContaining({
            id: 1,
            nome_completo: "João Silva",
          }),
        }),
      });
    });

    it("deve retornar erro quando email não existe", async () => {
      // Arrange
      Usuario.findOne.mockResolvedValue(null);

      // Act
      await AuthController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Credenciais inválidas",
        errors: {
          email: "Email ou senha incorretos",
        },
      });
    });

    it("deve retornar erro quando senha está incorreta", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        senha_hash: "hashedPassword",
        ativo: true,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await AuthController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Credenciais inválidas",
        errors: {
          email: "Email ou senha incorretos",
        },
      });
    });

    it("deve retornar erro quando conta está inativa", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        senha_hash: "hashedPassword",
        ativo: false,
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      bcrypt.compare.mockResolvedValue(true);

      // Act
      await AuthController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Conta inativa",
        errors: {
          conta: "Sua conta está inativa. Entre em contato com o suporte.",
        },
      });
    });

    it("deve retornar erro quando campos obrigatórios estão faltando", async () => {
      // Arrange
      req.body = { email: "teste@teste.com" }; // Senha faltando

      // Act
      await AuthController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email e senha são obrigatórios",
        errors: {
          senha: "Senha é obrigatória",
        },
      });
    });
  });
});
