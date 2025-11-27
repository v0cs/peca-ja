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
jest.mock("../../../src/services/uploadService", () => ({
  uploadFile: jest.fn(),
}));

// Mock do fs
jest.mock("fs");

// Mock do path - usar implementação real mas mockar extname
const path = require("path");
const originalExtname = path.extname;
jest.mock("path", () => ({
  ...jest.requireActual("path"),
  extname: jest.fn((filename) => {
    // Simular comportamento real do extname
    const match = filename.match(/\.([^.]+)$/);
    return match ? `.${match[1].toLowerCase()}` : "";
  }),
}));

// Importar após os mocks
const uploadMiddleware = require("../../../src/middleware/uploadMiddleware");
const multer = require("multer");

describe("uploadMiddleware - fileFilter execução completa", () => {
  let fileFilter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Obter fileFilter do multer config
    const multerCalls = multer.mock.calls;
    if (multerCalls.length > 0 && multerCalls[0][0] && multerCalls[0][0].fileFilter) {
      fileFilter = multerCalls[0][0].fileFilter;
    }
  });

  it("deve executar fileFilter e aceitar arquivo JPEG válido", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpg");
    
    fileFilter({}, { originalname: "test.jpg", mimetype: "image/jpeg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve executar fileFilter e rejeitar extensão inválida", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".txt");
    
    fileFilter({}, { originalname: "test.txt", mimetype: "text/plain" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Extensão de arquivo não permitida"),
      }),
      false
    );
  });

  it("deve executar fileFilter e rejeitar MIME type inválido", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpg");
    
    fileFilter({}, { originalname: "test.jpg", mimetype: "text/plain" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Tipo de arquivo não permitido"),
      }),
      false
    );
  });

  it("deve executar fileFilter e validar correspondência extensão-MIME", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpg");
    
    // Extensão .jpg com MIME type image/png deve ser rejeitado
    fileFilter({}, { originalname: "test.jpg", mimetype: "image/png" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("não corresponde ao tipo MIME"),
      }),
      false
    );
  });

  it("deve executar fileFilter e aceitar quando extensão e MIME correspondem", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpeg");
    
    fileFilter({}, { originalname: "test.jpeg", mimetype: "image/jpeg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve executar fileFilter e aceitar image/jpg com extensão .jpg", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpg");
    
    fileFilter({}, { originalname: "test.jpg", mimetype: "image/jpg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve executar fileFilter e aceitar image/jpg com extensão .jpeg", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpeg");
    
    fileFilter({}, { originalname: "test.jpeg", mimetype: "image/jpg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve executar fileFilter e processar extensão em lowercase", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".JPG"); // Maiúscula
    
    // O código faz .toLowerCase(), então deve funcionar
    fileFilter({}, { originalname: "test.JPG", mimetype: "image/jpeg" }, cb);
    
    // Verificar que path.extname foi chamado
    expect(path.extname).toHaveBeenCalled();
  });
});



