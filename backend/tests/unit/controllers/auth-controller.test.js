const { createModelMock, setupTransactionMock } = require("../../helpers/mockFactory");

// Criar mocks ANTES de tudo
const mockUsuario = createModelMock();
const mockCliente = createModelMock();
const mockAutopeca = createModelMock();
const mockVendedor = createModelMock();

const mockBcryptHash = jest.fn();
const mockBcryptCompare = jest.fn();
const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();

// Mock dos modelos
jest.mock("../../../src/models", () => ({
  Usuario: mockUsuario,
  Cliente: mockCliente,
  Autopeca: mockAutopeca,
  Vendedor: mockVendedor,
}));

// Mock do config
jest.mock("../../../src/config/env", () => ({
  frontendURL: "http://localhost:5173",
  JWT_SECRET: "test-secret",
  JWT_EXPIRES_IN: "24h",
  isProduction: false,
  PROTOCOL: "http",
}));

// Mock do bcrypt
jest.mock("bcryptjs", () => ({
  hash: mockBcryptHash,
  compare: mockBcryptCompare,
}));

// Mock do jwt
jest.mock("jsonwebtoken", () => ({
  sign: mockJwtSign,
  verify: mockJwtVerify,
}));

// Mock do cookieHelper - deve ser antes do import
const mockSetAuthCookie = jest.fn(() => {});
const mockClearAuthCookie = jest.fn(() => {});
jest.mock("../../../src/utils/cookieHelper", () => ({
  setAuthCookie: (...args) => mockSetAuthCookie(...args),
  clearAuthCookie: (...args) => mockClearAuthCookie(...args),
}));

// Importar APÓS os mocks
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthController = require("../../../src/controllers/authController");
const { Usuario, Cliente, Autopeca, Vendedor } = require("../../../src/models");
const config = require("../../../src/config/env");

describe("AuthController", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    // Limpar mocks individuais
    mockUsuario.findOne.mockClear();
    mockUsuario.create.mockClear();
    mockCliente.create.mockClear();
    mockAutopeca.findOne.mockClear();
    mockAutopeca.create.mockClear();
    mockVendedor.findOne.mockClear();
    mockBcryptHash.mockClear();
    mockBcryptCompare.mockClear();
    mockJwtSign.mockClear();
    mockJwtVerify.mockClear();
    mockSetAuthCookie.mockClear();
    mockClearAuthCookie.mockClear();
    
    // Reconfigurar transaction
    mockTransaction = setupTransactionMock(mockUsuario);

    // Mock request
    req = {
      body: {},
    };

    // Mock response
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn(),
      cookie: jest.fn(), // Para setAuthCookie
      clearCookie: jest.fn(), // Para clearAuthCookie
    };
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
      Usuario.findOne.mockResolvedValue({ id: 1, email: "joao@teste.com", ativo: true });

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
        termos_aceitos: true,
        data_aceite_terms: new Date(),
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
      expect(mockSetAuthCookie).toHaveBeenCalledWith(res, "jwt-token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Login realizado com sucesso",
        data: {
          usuario: expect.objectContaining({
            id: 1,
            email: "teste@teste.com",
            tipo_usuario: "cliente",
            ativo: true,
            termos_aceitos: expect.anything(),
            data_aceite_terms: expect.anything(),
          }),
          cliente: expect.objectContaining({
            id: 1,
            nome_completo: "João Silva",
            celular: "(11)99999-9999",
            cidade: "São Paulo",
            uf: "SP",
          }),
        },
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

  describe("googleCallback", () => {
    beforeEach(() => {
      req.user = {
        googleId: "google-123",
        email: "teste@teste.com",
        name: "Teste User",
        picture: "https://example.com/picture.jpg",
      };
      jwt.sign.mockReturnValue("jwt-token");
    });

    it("deve retornar erro 400 quando email não está disponível", async () => {
      // Arrange
      req.user = { googleId: "google-123" }; // Sem email

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email não encontrado no perfil do Google",
        errors: {
          email: "Não foi possível obter o email do Google. Tente novamente.",
        },
      });
    });

    it("deve redirecionar para cadastro quando usuário não existe", async () => {
      // Arrange
      Usuario.findOne.mockResolvedValue(null);

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(Usuario.findOne).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/cadastrar?email=")
      );
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("novoUsuario=true")
      );
    });

    it("deve redirecionar para recadastro quando usuário está inativo", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "cliente",
        ativo: false,
      };
      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/cadastrar?email=")
      );
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("contaExcluida=true")
      );
    });

    it("deve fazer login com sucesso para cliente existente", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "cliente",
        ativo: true,
        google_id: null,
        termos_aceitos: true,
        data_aceite_terms: new Date(),
        update: jest.fn().mockResolvedValue(true),
        cliente: {
          id: 1,
          nome_completo: "Teste User",
          celular: "(11)99999-9999",
          cidade: "São Paulo",
          uf: "SP",
        },
      };
      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(mockUsuario.update).toHaveBeenCalledWith({
        google_id: "google-123",
      });
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockSetAuthCookie).toHaveBeenCalledWith(res, expect.any(String));
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?success=true")
      );
      // Token não deve estar mais na URL, está em cookie httpOnly
      expect(res.redirect).not.toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?token=")
      );
    });

    it("deve fazer login com sucesso para autopeca existente", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "autopeca",
        ativo: true,
        google_id: "google-123",
        autopeca: {
          id: 1,
          razao_social: "Auto Peças LTDA",
          nome_fantasia: "Auto Peças",
          cnpj: "11222333000181",
          telefone: "(11)99999-9999",
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
        },
      };
      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockSetAuthCookie).toHaveBeenCalledWith(res, expect.any(String));
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?success=true")
      );
      // Token não deve estar mais na URL, está em cookie httpOnly
      expect(res.redirect).not.toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?token=")
      );
    });

    it("deve fazer login com sucesso para vendedor existente", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "vendedor",
        ativo: true,
        google_id: "google-123",
        termos_aceitos: true,
        data_aceite_terms: new Date(),
      };
      const mockVendedor = {
        id: 1,
        nome_completo: "Vendedor Teste",
        ativo: true,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          usuario: {
            id: 2,
            ativo: true,
          },
        },
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      Vendedor.findOne.mockResolvedValue(mockVendedor);

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(Vendedor.findOne).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockSetAuthCookie).toHaveBeenCalledWith(res, expect.any(String));
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?success=true")
      );
      // Token não deve estar mais na URL, está em cookie httpOnly
      expect(res.redirect).not.toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?token=")
      );
    });

    it("deve redirecionar com erro quando vendedor não está ativo", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "vendedor",
        ativo: true,
        google_id: "google-123",
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      Vendedor.findOne.mockResolvedValue(null);

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?success=false")
      );
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("error=")
      );
    });

    it("deve redirecionar com erro quando autopeça do vendedor está inativa", async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "vendedor",
        ativo: true,
        google_id: "google-123",
      };
      const mockVendedor = {
        id: 1,
        nome_completo: "Vendedor Teste",
        ativo: true,
        autopeca_id: 1,
        autopeca: {
          id: 1,
          usuario: {
            id: 2,
            ativo: false, // Autopeça inativa
          },
        },
      };

      Usuario.findOne.mockResolvedValue(mockUsuario);
      Vendedor.findOne.mockResolvedValue(mockVendedor);

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?success=false")
      );
    });

    it("deve retornar erro 500 quando JWT_SECRET não está configurado", async () => {
      // Arrange
      const originalJWTSecret = config.JWT_SECRET;
      const originalEnvJWTSecret = process.env.JWT_SECRET;
      
      // Mock config para retornar null para JWT_SECRET
      Object.defineProperty(config, "JWT_SECRET", {
        value: null,
        writable: true,
        configurable: true,
      });
      delete process.env.JWT_SECRET;

      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "cliente",
        ativo: true,
        google_id: "google-123",
        cliente: {
          id: 1,
          nome_completo: "Teste User",
        },
      };
      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Configuração de segurança não encontrada",
        errors: {
          message: "Configuração de segurança não encontrada",
        },
      });

      // Restore
      Object.defineProperty(config, "JWT_SECRET", {
        value: originalJWTSecret,
        writable: true,
        configurable: true,
      });
      if (originalEnvJWTSecret) {
        process.env.JWT_SECRET = originalEnvJWTSecret;
      }
    });

    it("deve redirecionar com erro quando ocorre exceção", async () => {
      // Arrange
      Usuario.findOne.mockRejectedValue(new Error("Database error"));

      // Act
      await AuthController.googleCallback(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/auth/oauth-callback?success=false")
      );
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("error=")
      );
    });
  });

  describe("logout", () => {
    it("deve fazer logout com sucesso", async () => {
      // Arrange
      req.user = { userId: 1, tipo: "cliente" };

      // Act
      await AuthController.logout(req, res);

      // Assert
      expect(mockClearAuthCookie).toHaveBeenCalledWith(res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Logout realizado com sucesso",
        data: {
          usuario_id: 1,
          tipo: "cliente",
          logout_timestamp: expect.any(String),
        },
      });
    });

    it("deve retornar erro 500 quando ocorre exceção", async () => {
      // Arrange
      req.user = { userId: 1, tipo: "cliente" };
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Simular erro fazendo req.user ser undefined para causar erro no código
      const originalUser = req.user;
      delete req.user;

      // Act
      await AuthController.logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro ao fazer logout",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Restore
      req.user = originalUser;
      consoleErrorSpy.mockRestore();
    });
  });

  describe("forgotPassword", () => {
    it("deve retornar erro quando email não é fornecido", async () => {
      req.body = {};

      await AuthController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email é obrigatório",
        errors: {
          email: "Email é obrigatório",
        },
      });
    });

    it("deve retornar erro quando formato de email é inválido", async () => {
      req.body = { email: "email-invalido" };

      await AuthController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Formato de email inválido",
        errors: {
          email: "Formato de email inválido",
        },
      });
    });

    it("deve retornar sucesso quando email não existe (segurança)", async () => {
      req.body = { email: "naoexiste@test.com" };
      mockUsuario.findOne.mockResolvedValue(null);

      await AuthController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha",
      });
    });


    it("deve retornar erro 500 quando ocorre erro", async () => {
      req.body = { email: "test@test.com" };
      mockUsuario.findOne.mockRejectedValue(new Error("Database error"));

      await AuthController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
    });
  });

  describe("resetPassword", () => {
    const mockTokenRecuperacao = {
      id: 1,
      token: "valid-token",
      data_expiracao: new Date(Date.now() + 3600000),
      utilizado: false,
      usuario: {
        id: 1,
        email: "test@test.com",
        update: jest.fn().mockResolvedValue(true),
      },
      update: jest.fn().mockResolvedValue(true),
    };

    it("deve retornar erro quando token não é fornecido", async () => {
      req.body = { nova_senha: "novaSenha123" };

      await AuthController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token e nova senha são obrigatórios",
        errors: expect.objectContaining({
          token: "Token é obrigatório",
        }),
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando nova_senha não é fornecida", async () => {
      req.body = { token: "valid-token" };

      await AuthController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token e nova senha são obrigatórios",
        errors: expect.objectContaining({
          nova_senha: "Nova senha é obrigatória",
        }),
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("deve retornar erro quando nova_senha é muito curta", async () => {
      req.body = { token: "valid-token", nova_senha: "123" };

      await AuthController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "A nova senha deve ter pelo menos 6 caracteres",
        errors: {
          nova_senha: "A senha deve ter pelo menos 6 caracteres",
        },
      });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

  });

  describe("me", () => {
    it("deve retornar informações do usuário cliente com sucesso", async () => {
      // Arrange
      req.user = { userId: 1, tipo: "cliente" };
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "cliente",
        ativo: true,
        termos_aceitos: true,
        data_aceite_terms: new Date(),
        consentimento_marketing: false,
        google_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        cliente: {
          id: 1,
          nome_completo: "João Silva",
          telefone: "(11)1234-5678",
          celular: "(11)98765-4321",
          cidade: "São Paulo",
          uf: "SP",
          created_at: new Date(),
          updated_at: new Date(),
        },
        autopeca: null,
      };
      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.me(req, res);

      // Assert
      expect(Usuario.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        include: [
          {
            model: Cliente,
            as: "cliente",
            required: false,
          },
          {
            model: Autopeca,
            as: "autopeca",
            required: false,
          },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Informações do usuário recuperadas com sucesso",
        data: {
          usuario: {
            id: 1,
            email: "teste@teste.com",
            tipo_usuario: "cliente",
            ativo: true,
            termos_aceitos: true,
            data_aceite_terms: mockUsuario.data_aceite_terms,
            consentimento_marketing: false,
            google_id: null,
            created_at: mockUsuario.created_at,
            updated_at: mockUsuario.updated_at,
          },
          cliente: {
            id: 1,
            nome_completo: "João Silva",
            telefone: "(11)1234-5678",
            celular: "(11)98765-4321",
            cidade: "São Paulo",
            uf: "SP",
            created_at: mockUsuario.cliente.created_at,
            updated_at: mockUsuario.cliente.updated_at,
          },
        },
      });
    });

    it("deve retornar informações do usuário autopeca com sucesso", async () => {
      // Arrange
      req.user = { userId: 2, tipo: "autopeca" };
      const mockUsuario = {
        id: 2,
        email: "autopeca@teste.com",
        tipo_usuario: "autopeca",
        ativo: true,
        termos_aceitos: true,
        data_aceite_terms: new Date(),
        consentimento_marketing: true,
        google_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        cliente: null,
        autopeca: {
          id: 1,
          razao_social: "Auto Peças Teste LTDA",
          nome_fantasia: "Auto Peças Teste",
          cnpj: "12345678000190",
          telefone: "(11)1234-5678",
          endereco_rua: "Rua Teste",
          endereco_numero: "123",
          endereco_bairro: "Centro",
          endereco_cidade: "São Paulo",
          endereco_uf: "SP",
          endereco_cep: "12345678",
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        },
      };
      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.me(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Informações do usuário recuperadas com sucesso",
        data: {
          usuario: {
            id: 2,
            email: "autopeca@teste.com",
            tipo_usuario: "autopeca",
            ativo: true,
            termos_aceitos: true,
            data_aceite_terms: mockUsuario.data_aceite_terms,
            consentimento_marketing: true,
            google_id: null,
            created_at: mockUsuario.created_at,
            updated_at: mockUsuario.updated_at,
          },
          autopeca: {
            id: 1,
            razao_social: "Auto Peças Teste LTDA",
            nome_fantasia: "Auto Peças Teste",
            cnpj: "12345678000190",
            telefone: "(11)1234-5678",
            endereco_rua: "Rua Teste",
            endereco_numero: "123",
            endereco_bairro: "Centro",
            endereco_cidade: "São Paulo",
            endereco_uf: "SP",
            endereco_cep: "12345678",
            created_at: mockUsuario.autopeca.data_criacao,
            updated_at: mockUsuario.autopeca.data_atualizacao,
          },
        },
      });
    });

    it("deve retornar erro 404 quando usuário não encontrado", async () => {
      // Arrange
      req.user = { userId: 999, tipo: "cliente" };
      Usuario.findOne.mockResolvedValue(null);

      // Act
      await AuthController.me(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Usuário não encontrado",
        errors: {
          user: "Usuário não existe no sistema",
        },
      });
    });

    it("deve retornar erro 403 quando conta está inativa", async () => {
      // Arrange
      req.user = { userId: 1, tipo: "cliente" };
      const mockUsuario = {
        id: 1,
        email: "teste@teste.com",
        tipo_usuario: "cliente",
        ativo: false,
        cliente: null,
        autopeca: null,
      };
      Usuario.findOne.mockResolvedValue(mockUsuario);

      // Act
      await AuthController.me(req, res);

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

    it("deve retornar erro 500 quando ocorre exceção", async () => {
      // Arrange
      req.user = { userId: 1, tipo: "cliente" };
      Usuario.findOne.mockRejectedValue(new Error("Database error"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      await AuthController.me(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
        errors: {
          message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        },
      });
      consoleErrorSpy.mockRestore();
    });
  });
});
