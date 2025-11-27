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
const mockS3Client = jest.fn();
const mockPutObjectCommand = jest.fn();
const mockDeleteObjectCommand = jest.fn();

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn((params) => {
    mockPutObjectCommand(params);
    return params;
  }),
  DeleteObjectCommand: jest.fn((params) => {
    mockDeleteObjectCommand(params);
    return params;
  }),
}));

// Mock do config/env
jest.mock("../../../src/config/env", () => ({
  isProduction: true,
  AWS_ACCESS_KEY_ID: "test-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  AWS_REGION: "us-east-1",
  AWS_S3_BUCKET_NAME: "test-bucket",
  FORCE_S3: undefined,
}));

const uploadService = require("../../../src/services/uploadService");

describe("UploadService - S3 Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  it("deve fazer upload para S3 com sucesso", async () => {
    const fileBuffer = Buffer.from("test content");
    const filename = "test_123.jpg";
    const mimetype = "image/jpeg";

    const result = await uploadService.uploadToS3(fileBuffer, filename, mimetype);

    expect(result).toHaveProperty("filename", filename);
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("storage", "s3");
    expect(result.url).toContain("test-bucket");
    expect(result.url).toContain(filename);
    expect(mockSend).toHaveBeenCalled();
  });

  it("deve tratar erro ao fazer upload para S3", async () => {
    const fileBuffer = Buffer.from("test");
    const filename = "test.jpg";
    const mimetype = "image/jpeg";
    
    mockSend.mockRejectedValue(new Error("S3 Error"));

    await expect(uploadService.uploadToS3(fileBuffer, filename, mimetype)).rejects.toThrow(
      "Falha ao fazer upload para S3"
    );
  });

  it("deve deletar arquivo do S3 com sucesso", async () => {
    const filename = "test_123.jpg";

    const result = await uploadService.deleteFromS3(filename);

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalled();
    expect(mockDeleteObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "test-bucket",
        Key: filename,
      })
    );
  });

  it("deve tratar erro ao deletar arquivo do S3", async () => {
    const filename = "test.jpg";
    
    mockSend.mockRejectedValue(new Error("S3 Delete Error"));

    await expect(uploadService.deleteFromS3(filename)).rejects.toThrow(
      "Falha ao deletar arquivo do S3"
    );
  });

  it("deve deletar arquivo usando deleteFile com storage s3", async () => {
    const filename = "test.jpg";

    const result = await uploadService.deleteFile(filename, "s3");

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalled();
  });

  it("deve deletar arquivo usando deleteFile com storage local", async () => {
    const filename = "test.jpg";
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.unlinkSync = jest.fn();

    const result = await uploadService.deleteFile(filename, "local");

    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalled();
  });

  it("deve usar S3 automaticamente quando em produção e S3 configurado", async () => {
    const filename = "test.jpg";
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.unlinkSync = jest.fn();

    // Em produção com S3 configurado, deve usar S3
    const result = await uploadService.deleteFile(filename);

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalled();
  });
});



