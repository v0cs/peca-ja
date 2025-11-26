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

// Mock do config/env com FORCE_S3
jest.mock("../../../src/config/env", () => ({
  isProduction: false,
  AWS_ACCESS_KEY_ID: "test-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  AWS_REGION: "us-east-1",
  AWS_S3_BUCKET_NAME: "test-bucket",
  FORCE_S3: undefined,
}));

const uploadService = require("../../../src/services/uploadService");

describe("UploadService - FORCE_S3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  it("deve verificar se S3 está configurado corretamente", () => {
    const isConfigured = uploadService.isS3Configured();
    expect(isConfigured).toBe(true);
  });

  it("deve ter método uploadFile disponível", () => {
    expect(uploadService.uploadFile).toBeDefined();
    expect(typeof uploadService.uploadFile).toBe("function");
  });

  it("deve ter método uploadToS3 disponível", () => {
    expect(uploadService.uploadToS3).toBeDefined();
    expect(typeof uploadService.uploadToS3).toBe("function");
  });

  it("deve ter método uploadToLocal disponível", () => {
    expect(uploadService.uploadToLocal).toBeDefined();
    expect(typeof uploadService.uploadToLocal).toBe("function");
  });
});

