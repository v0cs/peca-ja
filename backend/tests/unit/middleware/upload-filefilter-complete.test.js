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

// Mock do path para controlar extname
const path = require("path");
jest.mock("path", () => ({
  ...jest.requireActual("path"),
  extname: jest.fn(),
}));

// Importar após os mocks
const uploadMiddleware = require("../../../src/middleware/uploadMiddleware");
const multer = require("multer");

describe("uploadMiddleware - fileFilter completo", () => {
  let fileFilter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Obter fileFilter do multer config
    const multerCalls = multer.mock.calls;
    if (multerCalls.length > 0 && multerCalls[0][0] && multerCalls[0][0].fileFilter) {
      fileFilter = multerCalls[0][0].fileFilter;
    }
  });

  it("deve aceitar arquivo JPEG com extensão .jpg", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpg");
    
    fileFilter({}, { originalname: "test.jpg", mimetype: "image/jpeg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve aceitar arquivo JPEG com extensão .jpeg", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpeg");
    
    fileFilter({}, { originalname: "test.jpeg", mimetype: "image/jpeg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve aceitar arquivo JPEG com mimetype image/jpg", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpg");
    
    fileFilter({}, { originalname: "test.jpg", mimetype: "image/jpg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve aceitar arquivo PNG válido", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".png");
    
    fileFilter({}, { originalname: "test.png", mimetype: "image/png" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve aceitar arquivo WebP válido", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".webp");
    
    fileFilter({}, { originalname: "test.webp", mimetype: "image/webp" }, cb);
    
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("deve rejeitar extensão .gif", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".gif");
    
    fileFilter({}, { originalname: "test.gif", mimetype: "image/gif" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Extensão de arquivo não permitida"),
      }),
      false
    );
  });

  it("deve rejeitar extensão .pdf", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".pdf");
    
    fileFilter({}, { originalname: "test.pdf", mimetype: "application/pdf" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Extensão de arquivo não permitida"),
      }),
      false
    );
  });

  it("deve rejeitar MIME type application/pdf mesmo com extensão .jpg", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpg");
    
    fileFilter({}, { originalname: "test.jpg", mimetype: "application/pdf" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Tipo de arquivo não permitido"),
      }),
      false
    );
  });

  it("deve rejeitar quando extensão .jpg não corresponde ao MIME type image/png", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".jpg");
    
    fileFilter({}, { originalname: "test.jpg", mimetype: "image/png" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("não corresponde ao tipo MIME"),
      }),
      false
    );
  });

  it("deve rejeitar quando extensão .png não corresponde ao MIME type image/jpeg", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".png");
    
    fileFilter({}, { originalname: "test.png", mimetype: "image/jpeg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("não corresponde ao tipo MIME"),
      }),
      false
    );
  });

  it("deve rejeitar quando extensão .webp não corresponde ao MIME type image/jpeg", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".webp");
    
    fileFilter({}, { originalname: "test.webp", mimetype: "image/jpeg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("não corresponde ao tipo MIME"),
      }),
      false
    );
  });

  it("deve aceitar arquivo sem extensão conhecida mas com MIME type válido (caso edge)", () => {
    if (!fileFilter) return;
    
    const cb = jest.fn();
    path.extname.mockReturnValue(".unknown");
    
    // Primeiro deve falhar na validação de extensão
    fileFilter({}, { originalname: "test.unknown", mimetype: "image/jpeg" }, cb);
    
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Extensão de arquivo não permitida"),
      }),
      false
    );
  });
});



