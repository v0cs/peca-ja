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
    cb(null);
  };
});

const mockMulterSingle = jest.fn((fieldName) => {
  return (req, res, cb) => {
    cb(null);
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

jest.mock("multer", () => mockMulter);

// Importar APÓS os mocks
const { uploadMiddleware, uploadSingleMiddleware } = require("../../../src/middleware/uploadMiddleware");

describe("uploadMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    mockMulterArray.mockClear();
    mockMulterSingle.mockClear();

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
    it("deve processar upload com sucesso quando arquivos são válidos", () => {
      req.files = [
        {
          filename: "123_456.jpg",
          originalname: "test.jpg",
          mimetype: "image/jpeg",
          size: 1024,
          path: "/uploads/123_456.jpg",
        },
      ];

      mockMulterArray.mockImplementation((fieldName, maxCount) => {
        return (req, res, cb) => {
          cb(null);
        };
      });

      uploadMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.uploadedFiles).toBeDefined();
    });

    it("deve definir uploadedFiles vazio quando não há arquivos", () => {
      req.files = [];

      mockMulterArray.mockImplementation((fieldName, maxCount) => {
        return (req, res, cb) => {
          cb(null);
        };
      });

      uploadMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.uploadedFiles).toEqual([]);
    });
  });

  describe("Validação de Middlewares", () => {
    it("uploadMiddleware deve ser uma função", () => {
      expect(typeof uploadMiddleware).toBe("function");
    });

    it("uploadSingleMiddleware deve ser uma função", () => {
      expect(typeof uploadSingleMiddleware).toBe("function");
    });

    it("deve processar múltiplos arquivos corretamente", () => {
      req.files = [
        {
          filename: "123_456.jpg",
          originalname: "foto1.jpg",
          mimetype: "image/jpeg",
          size: 2048,
          path: "/uploads/123_456.jpg",
        },
        {
          filename: "789_101.png",
          originalname: "foto2.png",
          mimetype: "image/png",
          size: 4096,
          path: "/uploads/789_101.png",
        },
      ];

      mockMulterArray.mockImplementation((fieldName, maxCount) => {
        return (req, res, cb) => {
          cb(null);
        };
      });

      uploadMiddleware(req, res, next);

      expect(req.uploadedFiles).toHaveLength(2);
      expect(req.uploadedFiles[0]).toEqual({
        filename: "123_456.jpg",
        originalName: "foto1.jpg",
        mimetype: "image/jpeg",
        size: 2048,
        path: "/uploads/123_456.jpg",
      });
    });
  });
});
