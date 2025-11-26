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

describe("UploadService - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync = jest.fn();
    fs.existsSync = jest.fn();
    fs.unlinkSync = jest.fn();
    // Mock console.error para não poluir os testes
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
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
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Erro ao salvar arquivo localmente"),
      expect.any(Error)
    );
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
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Erro ao deletar arquivo local"),
      expect.any(Error)
    );
  });
});

