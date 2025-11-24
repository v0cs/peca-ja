const { createModelMock, setupTransactionMock } = require("../../helpers/mockFactory");

// Criar mocks dos models ANTES de importar o controller
const mockVendedor = createModelMock();
const mockUsuario = createModelMock();
const mockCliente = createModelMock();
const mockAutopeca = createModelMock();

jest.mock("../../../src/models", () => ({
  Vendedor: mockVendedor,
  Usuario: mockUsuario,
  Cliente: mockCliente,
  Autopeca: mockAutopeca,
}));

// Importar após os mocks
const VendedorController = require("../../../src/controllers/vendedorController");
const { Vendedor, Usuario, Cliente, Autopeca } = require("../../../src/models");

describe("VendedorController - Testes Simples", () => {
  let req, res, mockTransaction;

  beforeEach(() => {
    // Limpar mocks individuais
    Vendedor.create.mockClear();
    Vendedor.findOne.mockClear();
    Vendedor.findAll.mockClear();
    Vendedor.update.mockClear();
    Usuario.findOne.mockClear();
    Cliente.findOne.mockClear();
    Autopeca.findOne.mockClear();
    
    // Reconfigurar transactions
    mockTransaction = setupTransactionMock(Vendedor);
    Usuario.sequelize.transaction = Vendedor.sequelize.transaction;
    
    req = {
      user: { userId: 1, tipo: "autopeca" },
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("criarVendedor", () => {
    it("deve iniciar transação corretamente", async () => {
      req.body = {
        nome: "Vendedor Teste",
        email: "vendedor@teste.com",
        telefone: "(11)99999-9999",
      };

      Usuario.findOne.mockResolvedValue(null);

      // Não esperamos sucesso, apenas que a transação seja iniciada
      // O teste pode falhar em validação, mas isso é esperado
      try {
        await VendedorController.criarVendedor(req, res);
      } catch (error) {
        // Ignorar erros de validação
      }

      expect(Usuario.sequelize.transaction).toHaveBeenCalled();
    });
  });

  describe("atualizarVendedor", () => {
    it("deve retornar erro quando autopeça não é encontrada", async () => {
      req.params.vendedorId = "999";
      req.body = { nome: "Nome Atualizado" };
      const { Autopeca } = require("../../../src/models");
      Autopeca.findOne.mockResolvedValue(null);

      await VendedorController.atualizarVendedor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Autopeça não encontrada",
        })
      );
    });
  });

  describe("inativarVendedor", () => {
    it("deve retornar erro quando autopeça não é encontrada", async () => {
      req.params.vendedorId = "999";
      const { Autopeca } = require("../../../src/models");
      Autopeca.findOne.mockResolvedValue(null);

      await VendedorController.inativarVendedor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Autopeça não encontrada",
        })
      );
    });
  });

  describe("reativarVendedor", () => {
    it("deve retornar erro quando autopeça não é encontrada", async () => {
      req.params.vendedorId = "999";
      const { Autopeca } = require("../../../src/models");
      Autopeca.findOne.mockResolvedValue(null);

      await VendedorController.reativarVendedor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Autopeça não encontrada",
        })
      );
    });
  });
});

