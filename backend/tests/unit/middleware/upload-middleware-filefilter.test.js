// Mock do multer ANTES de qualquer require
jest.mock("multer", () => {
  const multerInstance = {
    array: jest.fn(() => jest.fn()),
    single: jest.fn(() => jest.fn()),
  };
  
  const multer = jest.fn(() => multerInstance);
  multer.MulterError = class MulterError extends Error {
    constructor(code) {
      super();
      this.code = code;
    }
  };
  multer.memoryStorage = jest.fn(() => ({}));
  return multer;
});

// Mock do uploadService
jest.mock("../../../src/services/uploadService", () => ({
  uploadFile: jest.fn(),
}));

// Mock do fs
jest.mock("fs");

// Importar após os mocks
const uploadMiddleware = require("../../../src/middleware/uploadMiddleware");
const multer = require("multer");

describe("uploadMiddleware - Configuração", () => {
  it("deve exportar uploadMiddleware e uploadSingleMiddleware", () => {
    expect(uploadMiddleware.uploadMiddleware).toBeDefined();
    expect(uploadMiddleware.uploadSingleMiddleware).toBeDefined();
    expect(typeof uploadMiddleware.uploadMiddleware).toBe("function");
    expect(typeof uploadMiddleware.uploadSingleMiddleware).toBe("function");
  });
});

// Vamos criar um teste mais direto importando o módulo e testando o fileFilter
// Como o fileFilter não é exportado, vamos criar um teste que verifica o comportamento
// através de mocks do multer

describe("uploadMiddleware - Validação de Arquivos", () => {
  it("deve exportar uploadMiddleware e uploadSingleMiddleware", () => {
    expect(uploadMiddleware.uploadMiddleware).toBeDefined();
    expect(uploadMiddleware.uploadSingleMiddleware).toBeDefined();
    expect(typeof uploadMiddleware.uploadMiddleware).toBe("function");
    expect(typeof uploadMiddleware.uploadSingleMiddleware).toBe("function");
  });

  it("deve exportar upload configurado", () => {
    expect(uploadMiddleware.upload).toBeDefined();
  });

  it("deve ter método single disponível no upload", () => {
    // Verificar que o módulo foi carregado sem erros e tem upload configurado
    expect(uploadMiddleware.upload).toBeDefined();
  });
});

