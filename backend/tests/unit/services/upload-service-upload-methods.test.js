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

describe("UploadService - uploadFile method", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync = jest.fn();
  });

  it("deve fazer upload de arquivo localmente quando S3 não está configurado", async () => {
    const fileBuffer = Buffer.from("test content");
    const originalName = "test.jpg";
    const mimetype = "image/jpeg";

    const result = await uploadService.uploadFile(fileBuffer, originalName, mimetype);

    expect(result).toHaveProperty("filename");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("storage", "local");
    expect(result.url).toContain("/uploads/");
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it("deve gerar nome único para cada arquivo", async () => {
    const fileBuffer = Buffer.from("test");
    const originalName = "test.jpg";
    const mimetype = "image/jpeg";

    const result1 = await uploadService.uploadFile(fileBuffer, originalName, mimetype);
    
    // Aguardar um pouco para garantir timestamp diferente
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await uploadService.uploadFile(fileBuffer, originalName, mimetype);

    expect(result1.filename).not.toBe(result2.filename);
  });

  it("deve preservar extensão do arquivo original", async () => {
    const fileBuffer = Buffer.from("test");
    const originalName = "image.png";
    const mimetype = "image/png";

    const result = await uploadService.uploadFile(fileBuffer, originalName, mimetype);

    expect(result.filename).toContain(".png");
    expect(path.extname).toHaveBeenCalledWith(originalName);
  });

  it("deve fazer upload de múltiplos arquivos", async () => {
    const files = [
      {
        buffer: Buffer.from("file1"),
        originalname: "file1.jpg",
        mimetype: "image/jpeg",
      },
      {
        buffer: Buffer.from("file2"),
        originalname: "file2.png",
        mimetype: "image/png",
      },
    ];

    const results = await uploadService.uploadFiles(files);

    expect(results).toHaveLength(2);
    expect(results[0].storage).toBe("local");
    expect(results[1].storage).toBe("local");
    expect(results[0].filename).toBeDefined();
    expect(results[1].filename).toBeDefined();
  });

  it("deve retornar array vazio quando nenhum arquivo é fornecido", async () => {
    const results = await uploadService.uploadFiles([]);
    expect(results).toHaveLength(0);
  });
});



