// Mock do fs e path ANTES de importar
const mockMkdirSync = jest.fn();
const mockExistsSync = jest.fn().mockReturnValue(true);

jest.mock("fs", () => ({
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
}));

jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  extname: jest.fn((filename) => {
    const match = filename.match(/\.(\w+)$/);
    return match ? `.${match[1]}` : "";
  }),
}));

// Mock do multer
const mockMulterArray = jest.fn((fieldName, maxCount) => {
  return (req, res, cb) => {
    // Simular processamento assíncrono
    setImmediate(() => cb(null));
  };
});

const mockMulterSingle = jest.fn((fieldName) => {
  return (req, res, cb) => {
    // Simular processamento assíncrono
    setImmediate(() => cb(null));
  };
});

const mockMulter = jest.fn(() => ({
  array: mockMulterArray,
  single: mockMulterSingle,
}));

mockMulter.MulterError = class MulterError extends Error {
  constructor(code, field) {
    super(code);
    this.code = code;
    this.field = field;
    this.name = "MulterError";
  }
};

mockMulter.diskStorage = jest.fn(() => ({}));
mockMulter.memoryStorage = jest.fn(() => ({}));

jest.mock("multer", () => mockMulter);

// Mock do uploadService
const mockUploadFile = jest.fn();
jest.mock("../../../src/services/uploadService", () => ({
  uploadFile: mockUploadFile,
}));

// Importar APÓS os mocks
const { uploadMiddleware, uploadSingleMiddleware } = require("../../../src/middleware/uploadMiddleware");

describe("uploadMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    mockMulterArray.mockClear();
    mockMulterSingle.mockClear();
    mockUploadFile.mockClear();

    req = {
      files: [],
      file: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("uploadMiddleware (múltiplos arquivos)", () => {
    it("deve processar upload com sucesso quando arquivos são válidos", async () => {
      const mockFile = {
        buffer: Buffer.from("test"),
        originalname: "test.jpg",
        mimetype: "image/jpeg",
      };

      req.files = [mockFile];

      mockUploadFile.mockResolvedValue({
        filename: "123_456.jpg",
        url: "/uploads/123_456.jpg",
        storage: "local",
        path: "/uploads/123_456.jpg",
      });

      // O middleware precisa ser executado e esperado
      await new Promise((resolve) => {
        uploadMiddleware(req, res, () => {
          next();
          resolve();
        });
      });

      expect(next).toHaveBeenCalled();
      expect(req.uploadedFiles).toBeDefined();
      expect(mockUploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname,
        mockFile.mimetype
      );
    });

    it("deve definir uploadedFiles vazio quando não há arquivos", async () => {
      req.files = [];

      await new Promise((resolve) => {
        uploadMiddleware(req, res, () => {
          next();
          resolve();
        });
      });

      expect(next).toHaveBeenCalled();
      expect(req.uploadedFiles).toEqual([]);
      expect(mockUploadFile).not.toHaveBeenCalled();
    });
  });

  describe("Validação de Middlewares", () => {
    it("uploadMiddleware deve ser uma função", () => {
      expect(typeof uploadMiddleware).toBe("function");
    });

    it("uploadSingleMiddleware deve ser uma função", () => {
      expect(typeof uploadSingleMiddleware).toBe("function");
    });

    it("deve processar múltiplos arquivos corretamente", async () => {
      const mockFile1 = {
        buffer: Buffer.from("test1"),
        originalname: "foto1.jpg",
        mimetype: "image/jpeg",
        size: 2048,
      };
      const mockFile2 = {
        buffer: Buffer.from("test2"),
        originalname: "foto2.png",
        mimetype: "image/png",
        size: 4096,
      };

      req.files = [mockFile1, mockFile2];

      mockUploadFile
        .mockResolvedValueOnce({
          filename: "123_456.jpg",
          url: "/uploads/123_456.jpg",
          storage: "local",
          path: "/uploads/123_456.jpg",
        })
        .mockResolvedValueOnce({
          filename: "789_101.png",
          url: "/uploads/789_101.png",
          storage: "local",
          path: "/uploads/789_101.png",
        });

      await new Promise((resolve) => {
        uploadMiddleware(req, res, () => {
          next();
          resolve();
        });
      });

      expect(req.uploadedFiles).toHaveLength(2);
      expect(req.uploadedFiles[0]).toEqual({
        filename: "123_456.jpg",
        originalName: "foto1.jpg",
        mimetype: "image/jpeg",
        size: 2048,
        url: "/uploads/123_456.jpg",
        storage: "local",
        path: "/uploads/123_456.jpg",
      });
      expect(req.uploadedFiles[1]).toEqual({
        filename: "789_101.png",
        originalName: "foto2.png",
        mimetype: "image/png",
        size: 4096,
        url: "/uploads/789_101.png",
        storage: "local",
        path: "/uploads/789_101.png",
      });
    });
  });
});
