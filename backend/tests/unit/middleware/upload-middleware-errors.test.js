// Mock do multer ANTES de qualquer require
const mockMulterArray = jest.fn();
const mockMulterSingle = jest.fn();

jest.mock("multer", () => {
  const multerInstance = {
    array: jest.fn(() => mockMulterArray),
    single: jest.fn(() => mockMulterSingle),
  };
  
  const multer = jest.fn(() => multerInstance);
  multer.MulterError = class MulterError extends Error {
    constructor(code) {
      super();
      this.code = code;
      this.name = "MulterError";
    }
  };
  multer.memoryStorage = jest.fn(() => ({}));
  return multer;
});

// Mock do uploadService
const mockUploadFile = jest.fn();
jest.mock("../../../src/services/uploadService", () => ({
  uploadFile: mockUploadFile,
}));

// Mock do fs
jest.mock("fs");

// Mock do path
jest.mock("path", () => ({
  ...jest.requireActual("path"),
  extname: jest.fn((filename) => {
    const match = filename.match(/\.(\w+)$/);
    return match ? `.${match[1]}` : "";
  }),
}));

const { uploadMiddleware, uploadSingleMiddleware } = require("../../../src/middleware/uploadMiddleware");
const multer = require("multer");

describe("uploadMiddleware - Tratamento de Erros", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      files: [],
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    mockUploadFile.mockResolvedValue({
      filename: "test.jpg",
      url: "/uploads/test.jpg",
      storage: "local",
    });
  });

  it("deve tratar erro LIMIT_FILE_SIZE", async () => {
    const error = new multer.MulterError("LIMIT_FILE_SIZE");
    mockMulterArray.mockImplementation((req, res, cb) => cb(error));

    await uploadMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Arquivo muito grande. Tamanho máximo permitido: 5MB por imagem.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve tratar erro LIMIT_FILE_COUNT", async () => {
    const error = new multer.MulterError("LIMIT_FILE_COUNT");
    mockMulterArray.mockImplementation((req, res, cb) => cb(error));

    await uploadMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Muitos arquivos. Máximo permitido: 3 imagens por solicitação.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve tratar erro LIMIT_UNEXPECTED_FILE", async () => {
    const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
    mockMulterArray.mockImplementation((req, res, cb) => cb(error));

    await uploadMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Campo de arquivo inesperado. Use o campo "images".',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve tratar erro de tipo de arquivo não permitido", async () => {
    const error = new Error("Tipo de arquivo não permitido. Apenas JPEG, PNG e WebP são aceitos.");
    mockMulterArray.mockImplementation((req, res, cb) => cb(error));

    await uploadMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: error.message,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve tratar outros erros genéricos", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    
    const error = new Error("Erro genérico");
    mockMulterArray.mockImplementation((req, res, cb) => cb(error));

    await uploadMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Erro interno do servidor durante o upload.",
      error: expect.any(String),
    });
    expect(next).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
  });

  it("deve continuar quando não há arquivos", async () => {
    req.files = [];
    mockMulterArray.mockImplementation((req, res, cb) => cb(null));

    await uploadMiddleware(req, res, next);

    expect(req.uploadedFiles).toEqual([]);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("deve processar arquivos quando enviados com sucesso", async () => {
    req.files = [
      {
        buffer: Buffer.from("test"),
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      },
    ];
    
    // O multer precisa processar e chamar o callback, mas os arquivos já estão em req.files
    mockMulterArray.mockImplementation((req, res, cb) => {
      // Simular que o multer processou e colocou os arquivos em req.files
      setImmediate(() => cb(null));
    });

    await new Promise((resolve) => {
      uploadMiddleware(req, res, () => {
        next();
        resolve();
      });
    });

    expect(mockUploadFile).toHaveBeenCalled();
    expect(req.uploadedFiles).toBeDefined();
    expect(Array.isArray(req.uploadedFiles)).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it("deve tratar erro durante upload de arquivos", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    
    req.files = [
      {
        buffer: Buffer.from("test"),
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      },
    ];
    mockMulterArray.mockImplementation((req, res, cb) => {
      setImmediate(() => cb(null));
    });
    mockUploadFile.mockRejectedValue(new Error("Erro no upload"));

    await new Promise((resolve) => {
      uploadMiddleware(req, res, next);
      // Aguardar um pouco para o processamento assíncrono
      setTimeout(resolve, 100);
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Erro ao processar upload dos arquivos.",
      error: expect.any(String),
    });
    expect(next).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
  });
});

describe("uploadSingleMiddleware - Tratamento de Erros", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    mockUploadFile.mockResolvedValue({
      filename: "test.jpg",
      url: "/uploads/test.jpg",
      storage: "local",
    });
  });

  it("deve tratar erro LIMIT_FILE_SIZE", async () => {
    const error = new multer.MulterError("LIMIT_FILE_SIZE");
    mockMulterSingle.mockImplementation((req, res, cb) => cb(error));

    await uploadSingleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Arquivo muito grande. Tamanho máximo permitido: 5MB.",
    });
  });

  it("deve tratar erro LIMIT_UNEXPECTED_FILE", async () => {
    const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
    mockMulterSingle.mockImplementation((req, res, cb) => cb(error));

    await uploadSingleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Campo de arquivo inesperado. Use o campo "image".',
    });
  });

  it("deve continuar quando não há arquivo", async () => {
    req.file = null;
    mockMulterSingle.mockImplementation((req, res, cb) => cb(null));

    await uploadSingleMiddleware(req, res, next);

    expect(req.uploadedFile).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  it("deve processar arquivo único quando enviado com sucesso", async () => {
    req.file = {
      buffer: Buffer.from("test"),
      originalname: "test.jpg",
      mimetype: "image/jpeg",
      size: 1024,
    };
    mockMulterSingle.mockImplementation((req, res, cb) => cb(null));

    await uploadSingleMiddleware(req, res, next);

    expect(mockUploadFile).toHaveBeenCalled();
    expect(req.uploadedFile).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it("deve tratar erro durante upload de arquivo único", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    
    req.file = {
      buffer: Buffer.from("test"),
      originalname: "test.jpg",
      mimetype: "image/jpeg",
      size: 1024,
    };
    mockMulterSingle.mockImplementation((req, res, cb) => {
      setImmediate(() => cb(null));
    });
    mockUploadFile.mockRejectedValue(new Error("Erro no upload"));

    await new Promise((resolve) => {
      uploadSingleMiddleware(req, res, next);
      // Aguardar um pouco para o processamento assíncrono
      setTimeout(resolve, 100);
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Erro ao processar upload do arquivo.",
      error: expect.any(String),
    });
    expect(next).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
  });

  it("deve tratar erro de tipo de arquivo não permitido no uploadSingle", async () => {
    const error = new Error("Tipo de arquivo não permitido. Apenas JPEG, PNG e WebP são aceitos.");
    mockMulterSingle.mockImplementation((req, res, cb) => cb(error));

    await uploadSingleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: error.message,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve tratar outros erros genéricos no uploadSingle", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    
    const error = new Error("Erro genérico no uploadSingle");
    mockMulterSingle.mockImplementation((req, res, cb) => cb(error));

    await uploadSingleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Erro interno do servidor durante o upload.",
      error: expect.any(String),
    });
    expect(next).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
  });
});

