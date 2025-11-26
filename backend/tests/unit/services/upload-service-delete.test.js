// Mock do fs ANTES de qualquer require
jest.mock("fs");
const fs = require("fs");

// Mock do path
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
  extname: jest.fn((filename) => {
    const match = filename.match(/\.(\w+)$/);
    return match ? `.${match[1]}` : "";
  }),
}));

// Mock do @aws-sdk/client-s3
const mockSend = jest.fn();
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn((params) => params),
  DeleteObjectCommand: jest.fn((params) => params),
}));

// Mock do config/env
jest.mock("../../../src/config/env", () => ({
  isProduction: false,
  AWS_ACCESS_KEY_ID: undefined,
  AWS_SECRET_ACCESS_KEY: undefined,
  AWS_REGION: undefined,
  AWS_S3_BUCKET_NAME: undefined,
}));

const uploadService = require("../../../src/services/uploadService");

describe("UploadService - Delete Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync = jest.fn();
    fs.unlinkSync = jest.fn();
    mockSend.mockResolvedValue({});
  });

  it("deve deletar arquivo local quando existe", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});

    const result = await uploadService.deleteFromLocal("test.jpg");

    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  it("deve retornar false quando arquivo local não existe", async () => {
    fs.existsSync.mockReturnValue(false);

    const result = await uploadService.deleteFromLocal("nonexistent.jpg");

    expect(result).toBe(false);
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it("deve usar deleteFile com storage local quando especificado", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});

    const result = await uploadService.deleteFile("test.jpg", "local");

    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalled();
  });

  it("deve ter método deleteFile disponível", () => {
    expect(uploadService.deleteFile).toBeDefined();
    expect(typeof uploadService.deleteFile).toBe("function");
  });

  it("deve determinar storage automaticamente baseado no ambiente ao deletar", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});

    // Sem especificar storage, deve usar local em desenvolvimento
    const result = await uploadService.deleteFile("test.jpg");

    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalled();
  });
});

