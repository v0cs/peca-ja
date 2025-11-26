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
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
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

describe("UploadService - uploadToLocal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync = jest.fn();
  });

  it("deve salvar arquivo localmente e retornar informações corretas", async () => {
    const fileBuffer = Buffer.from("test file content");
    const filename = "test_123456.jpg";
    const originalName = "test.jpg";

    const result = await uploadService.uploadToLocal(
      fileBuffer,
      filename,
      originalName
    );

    expect(result).toHaveProperty("filename", filename);
    expect(result).toHaveProperty("url", `/uploads/${filename}`);
    expect(result).toHaveProperty("storage", "local");
    expect(result).toHaveProperty("path");
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it("deve construir caminho correto do arquivo", async () => {
    const fileBuffer = Buffer.from("test");
    const filename = "test.jpg";
    const originalName = "test.jpg";

    await uploadService.uploadToLocal(fileBuffer, filename, originalName);

    expect(path.join).toHaveBeenCalled();
    const pathCalls = path.join.mock.calls;
    expect(pathCalls.length).toBeGreaterThan(0);
  });
});

describe("UploadService - uploadFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync = jest.fn();
  });

  it("deve usar upload local quando S3 não está configurado", async () => {
    const fileBuffer = Buffer.from("test");
    const originalName = "test.jpg";
    const mimetype = "image/jpeg";

    const result = await uploadService.uploadFile(
      fileBuffer,
      originalName,
      mimetype
    );

    expect(result.storage).toBe("local");
    expect(result.filename).toBeDefined();
    expect(result.url).toContain("/uploads/");
  });

  it("deve gerar nome único para cada arquivo", async () => {
    const fileBuffer = Buffer.from("test");
    const originalName = "test.jpg";
    const mimetype = "image/jpeg";

    const result1 = await uploadService.uploadFile(
      fileBuffer,
      originalName,
      mimetype
    );
    
    // Aguardar um pouco para garantir timestamp diferente
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await uploadService.uploadFile(
      fileBuffer,
      originalName,
      mimetype
    );

    expect(result1.filename).not.toBe(result2.filename);
  });
});

describe("UploadService - uploadFiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync = jest.fn();
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

describe("UploadService - deleteFromLocal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync = jest.fn();
    fs.unlinkSync = jest.fn();
  });

  it("deve deletar arquivo quando existe", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});

    const result = await uploadService.deleteFromLocal("test.jpg");

    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  it("deve retornar false quando arquivo não existe", async () => {
    fs.existsSync.mockReturnValue(false);

    const result = await uploadService.deleteFromLocal("nonexistent.jpg");

    expect(result).toBe(false);
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});

describe("UploadService - getFileUrl", () => {
  it("deve retornar URL local quando storage é local", () => {
    const url = uploadService.getFileUrl("test.jpg", "local");
    expect(url).toBe("/uploads/test.jpg");
  });

  it("deve retornar URL local quando storage não é especificado e S3 não está configurado", () => {
    const url = uploadService.getFileUrl("test.jpg");
    expect(url).toBe("/uploads/test.jpg");
  });

  it("deve construir caminho correto para arquivo local", () => {
    const url = uploadService.getFileUrl("image_123.png", "local");
    expect(url).toBe("/uploads/image_123.png");
  });
});

describe("UploadService - deleteFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync = jest.fn();
    fs.unlinkSync = jest.fn();
  });

  it("deve deletar arquivo local quando storage é local", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});

    const result = await uploadService.deleteFile("test.jpg", "local");

    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalled();
  });

  it("deve usar storage local quando não especificado e S3 não está configurado", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});

    const result = await uploadService.deleteFile("test.jpg");

    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalled();
  });
});

