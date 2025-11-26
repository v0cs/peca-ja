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
  AWS_ACCESS_KEY_ID: "test-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  AWS_REGION: "us-east-1",
  AWS_S3_BUCKET_NAME: "test-bucket",
  FORCE_S3: undefined,
}));

const uploadService = require("../../../src/services/uploadService");

describe("UploadService - Constructor and Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();
  });

  it("deve verificar se S3 está configurado quando todas as credenciais estão presentes", () => {
    const isConfigured = uploadService.isS3Configured();
    expect(isConfigured).toBe(true);
  });

  it("deve verificar se S3 está configurado corretamente", () => {
    // Com todas as credenciais presentes, deve estar configurado
    const isConfigured = uploadService.isS3Configured();
    expect(typeof isConfigured).toBe("boolean");
  });

  it("deve ter métodos de upload disponíveis", () => {
    expect(uploadService.uploadFile).toBeDefined();
    expect(uploadService.uploadFiles).toBeDefined();
    expect(uploadService.uploadToLocal).toBeDefined();
    expect(uploadService.uploadToS3).toBeDefined();
  });

  it("deve gerar nome único para arquivo", () => {
    const originalName = "test.jpg";
    const filename1 = uploadService.generateUniqueFilename(originalName);
    const filename2 = uploadService.generateUniqueFilename(originalName);

    expect(filename1).toContain(".jpg");
    expect(filename2).toContain(".jpg");
    expect(filename1).not.toBe(filename2);
  });

  it("deve preservar extensão ao gerar nome único", () => {
    const filename1 = uploadService.generateUniqueFilename("image.png");
    const filename2 = uploadService.generateUniqueFilename("document.pdf");

    expect(filename1).toContain(".png");
    expect(filename2).toContain(".pdf");
  });
});

