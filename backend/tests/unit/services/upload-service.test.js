// Mock do fs ANTES de qualquer require
jest.mock("fs");
const fs = require("fs");

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

const UploadService = require("../../../src/services/uploadService");
const path = require("path");
const crypto = require("crypto");

describe("UploadService", () => {
  let uploadService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    fs.existsSync = jest.fn(() => false);
    fs.mkdirSync = jest.fn();
    // UploadService é exportado como instância singleton
    uploadService = require("../../../src/services/uploadService");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isS3Configured", () => {
    it("deve retornar false quando AWS_ACCESS_KEY_ID não está configurado", () => {
      expect(uploadService.isS3Configured()).toBe(false);
    });

    it("deve retornar false quando alguma configuração do S3 está faltando", () => {
      // Com o mock atual, todas as configurações estão undefined
      expect(uploadService.isS3Configured()).toBe(false);
    });
  });

  describe("generateUniqueFilename", () => {
    it("deve gerar nome de arquivo único", () => {
      const originalName = "test.jpg";
      const filename1 = uploadService.generateUniqueFilename(originalName);
      const filename2 = uploadService.generateUniqueFilename(originalName);

      expect(filename1).not.toBe(filename2);
      expect(filename1).toContain(".jpg");
      expect(filename2).toContain(".jpg");
    });

    it("deve incluir timestamp no nome do arquivo", () => {
      const originalName = "test.jpg";
      const filename = uploadService.generateUniqueFilename(originalName);
      const timestamp = Date.now().toString();

      // O timestamp deve estar no início do nome
      expect(filename).toMatch(/^\d+_/);
    });

    it("deve preservar a extensão do arquivo original", () => {
      const extensions = [".jpg", ".png", ".pdf", ".txt", ".gif"];

      extensions.forEach((ext) => {
        const filename = uploadService.generateUniqueFilename(`test${ext}`);
        expect(filename).toContain(ext);
        expect(path.extname(filename)).toBe(ext);
      });
    });

    it("deve gerar nomes diferentes para o mesmo arquivo", () => {
      const originalName = "test.jpg";
      const filenames = new Set();

      // Gerar 10 nomes e verificar que são únicos
      for (let i = 0; i < 10; i++) {
        filenames.add(uploadService.generateUniqueFilename(originalName));
      }

      expect(filenames.size).toBe(10);
    });

    it("deve funcionar com arquivos sem extensão", () => {
      const originalName = "test";
      const filename = uploadService.generateUniqueFilename(originalName);

      expect(filename).toBeDefined();
      expect(typeof filename).toBe("string");
      expect(filename.length).toBeGreaterThan(0);
    });

    it("deve incluir sufixo aleatório no nome", () => {
      const originalName = "test.jpg";
      const filename = uploadService.generateUniqueFilename(originalName);

      // Deve ter formato: timestamp_hexadecimals.extensão
      const parts = filename.split("_");
      expect(parts.length).toBeGreaterThanOrEqual(2);
      // A segunda parte deve ter caracteres hexadecimais
      expect(parts[1]).toMatch(/^[0-9a-f]+\.jpg$/);
    });
  });

});

