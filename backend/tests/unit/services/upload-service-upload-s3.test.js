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
  isProduction: true,
  AWS_ACCESS_KEY_ID: "test-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  AWS_REGION: "us-east-1",
  AWS_S3_BUCKET_NAME: "test-bucket",
  FORCE_S3: undefined,
}));

const uploadService = require("../../../src/services/uploadService");

describe("UploadService - Upload para S3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  it("deve fazer upload para S3 quando em produção e S3 configurado", async () => {
    const fileBuffer = Buffer.from("test content");
    const originalName = "test.jpg";
    const mimetype = "image/jpeg";

    const result = await uploadService.uploadFile(fileBuffer, originalName, mimetype);

    expect(result.storage).toBe("s3");
    expect(result.filename).toBeDefined();
    expect(result.url).toContain("s3.amazonaws.com");
    expect(mockSend).toHaveBeenCalled();
  });

  it("deve gerar URL S3 corretamente para us-east-1", async () => {
    const fileBuffer = Buffer.from("test");
    const filename = "test_123.jpg";
    const mimetype = "image/jpeg";

    const result = await uploadService.uploadToS3(fileBuffer, filename, mimetype);

    expect(result.url).toBe("https://test-bucket.s3.amazonaws.com/test_123.jpg");
  });

  it("deve incluir ContentType no upload para S3", async () => {
    const fileBuffer = Buffer.from("test");
    const filename = "test.jpg";
    const mimetype = "image/jpeg";

    await uploadService.uploadToS3(fileBuffer, filename, mimetype);

    // Verificar que PutObjectCommand foi chamado com ContentType
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        ContentType: mimetype,
        Body: fileBuffer,
        Key: filename,
        Bucket: "test-bucket",
      })
    );
  });
});



