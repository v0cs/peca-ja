// Mock do fs ANTES de qualquer require
jest.mock("fs");

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

// Mock do config/env para testar diferentes regiões
jest.mock("../../../src/config/env", () => ({
  isProduction: true,
  AWS_ACCESS_KEY_ID: "test-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  AWS_REGION: "us-west-2",
  AWS_S3_BUCKET_NAME: "test-bucket",
}));

const uploadService = require("../../../src/services/uploadService");

describe("UploadService - URL S3 com diferentes regiões", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  it("deve gerar URL S3 corretamente para região diferente de us-east-1", async () => {
    const fileBuffer = Buffer.from("test");
    const filename = "test.jpg";
    const mimetype = "image/jpeg";

    const result = await uploadService.uploadToS3(fileBuffer, filename, mimetype);

    expect(result.url).toBe("https://test-bucket.s3.us-west-2.amazonaws.com/test.jpg");
  });

  it("deve gerar URL S3 corretamente no getFileUrl para região diferente de us-east-1", () => {
    const url = uploadService.getFileUrl("test.jpg", "s3");
    expect(url).toBe("https://test-bucket.s3.us-west-2.amazonaws.com/test.jpg");
  });
});

