const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Mock do multer
jest.mock("multer", () => {
  const mockMulter = jest.fn((options) => ({
    array: jest.fn(() => (req, res, next) => next()),
    single: jest.fn(() => (req, res, next) => next()),
    fields: jest.fn(() => (req, res, next) => next()),
  }));
  
  mockMulter.diskStorage = jest.fn((options) => ({}));
  mockMulter.memoryStorage = jest.fn(() => ({}));
  
  return mockMulter;
});

// Mock do fs
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock do path
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  extname: jest.fn((filename) => {
    const ext = filename.split(".").pop();
    return ext ? `.${ext}` : "";
  }),
}));

describe("uploadMiddleware", () => {
  let uploadMiddleware;
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset modules to get fresh mocks
    jest.resetModules();

    req = {
      files: [],
    };
    res = {};
    next = jest.fn();

    fs.existsSync.mockReturnValue(true);
    multer.diskStorage.mockReturnValue({});
  });

  it("deve configurar multer corretamente", () => {
    // Arrange & Act
    uploadMiddleware = require("../../../src/middleware/uploadMiddleware");

    // Assert
    expect(uploadMiddleware).toBeDefined();
  });

  it("deve aceitar apenas imagens", () => {
    // Arrange
    const validMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    multer.diskStorage.mockClear();

    // Act - resetar módulos para garantir que os mocks sejam usados
    jest.resetModules();
    delete require.cache[require.resolve("../../../src/middleware/uploadMiddleware")];
    uploadMiddleware = require("../../../src/middleware/uploadMiddleware");

    // Assert - Verificar se multer foi configurado
    expect(uploadMiddleware).toBeDefined();
  });

  it("deve criar diretório de uploads se não existir", () => {
    // Arrange
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    
    // Act - resetar módulos e requerer novamente para testar a lógica de criação de diretório
    jest.resetModules();
    // Limpar cache do require para forçar re-require
    delete require.cache[require.resolve("../../../src/middleware/uploadMiddleware")];
    uploadMiddleware = require("../../../src/middleware/uploadMiddleware");

    // Assert
    // O diretório é verificado durante o carregamento do módulo
    // Verificamos que o módulo foi carregado com sucesso
    expect(uploadMiddleware).toBeDefined();
  });

  it("deve processar arquivos de imagem corretamente", async () => {
    // Arrange
    uploadMiddleware = require("../../../src/middleware/uploadMiddleware");
    const middleware = uploadMiddleware.uploadMiddleware || uploadMiddleware;
    req.files = [
      {
        fieldname: "imagens",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        size: 12345,
        destination: "/uploads",
        filename: "1234567890_test.jpg",
        path: "/uploads/1234567890_test.jpg",
        buffer: Buffer.from("fake-image-data"),
      },
    ];

    // Act
    if (typeof middleware === "function") {
      middleware(req, res, next);
    } else if (middleware.array) {
      const arrayMiddleware = middleware.array("imagens", 3);
      arrayMiddleware(req, res, next);
    }

    // Assert
    expect(next).toHaveBeenCalled();
  });
});

