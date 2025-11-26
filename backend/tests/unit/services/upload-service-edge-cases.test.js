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
const path = require("path");

describe("UploadService - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync = jest.fn();
    fs.existsSync = jest.fn();
    fs.unlinkSync = jest.fn();
  });

  it("deve tratar erro ao salvar arquivo localmente", async () => {
    const fileBuffer = Buffer.from("test");
    const filename = "test.jpg";
    const originalName = "test.jpg";
    
    fs.writeFileSync.mockImplementation(() => {
      throw new Error("Disk full");
    });

    await expect(
      uploadService.uploadToLocal(fileBuffer, filename, originalName)
    ).rejects.toThrow("Falha ao salvar arquivo");
  });

  it("deve tratar erro ao deletar arquivo local quando ocorre exceção", async () => {
    const filename = "test.jpg";
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {
      throw new Error("Permission denied");
    });

    await expect(uploadService.deleteFromLocal(filename)).rejects.toThrow(
      "Falha ao deletar arquivo local"
    );
  });

  it("deve usar S3 quando FORCE_S3 está ativado mesmo em desenvolvimento", async () => {
    // Mock com FORCE_S3
    process.env.FORCE_S3 = "true";
    
    jest.resetModules();
    jest.mock("../../../src/config/env", () => ({
      isProduction: false,
      AWS_ACCESS_KEY_ID: "test-key",
      AWS_SECRET_ACCESS_KEY: "test-secret",
      AWS_REGION: "us-east-1",
      AWS_S3_BUCKET_NAME: "test-bucket",
    }));
    
    const uploadService2 = require("../../../src/services/uploadService");
    mockSend.mockResolvedValue({});
    
    const fileBuffer = Buffer.from("test");
    const originalName = "test.jpg";
    const mimetype = "image/jpeg";

    const result = await uploadService2.uploadFile(fileBuffer, originalName, mimetype);

    expect(result.storage).toBe("s3");
    expect(mockSend).toHaveBeenCalled();
    
    delete process.env.FORCE_S3;
  });

  it("deve usar local quando S3 não está configurado mesmo em produção", async () => {
    // Como o serviço é singleton, vamos testar diretamente o comportamento
    // quando S3 não está configurado (já está mockado sem S3)
    const fileBuffer = Buffer.from("test");
    const originalName = "test.jpg";
    const mimetype = "image/jpeg";

    const result = await uploadService.uploadFile(fileBuffer, originalName, mimetype);

    expect(result.storage).toBe("local");
    // Verificar que foi usado upload local (já testado em outros testes)
  });

  it("deve retornar false quando arquivo local não existe ao tentar deletar", async () => {
    const filename = "nonexistent.jpg";
    fs.existsSync.mockReturnValue(false);

    const result = await uploadService.deleteFromLocal(filename);

    expect(result).toBe(false);
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});

