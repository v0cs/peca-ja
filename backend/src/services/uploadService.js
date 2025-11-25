const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("../config/env");

/**
 * Serviço de Upload de Arquivos
 *
 * Gerencia upload de arquivos para:
 * - Desenvolvimento: Armazenamento local (pasta uploads/)
 * - Produção: AWS S3
 */
class UploadService {
  constructor() {
    this.config = config;
    this.isProduction = config.isProduction;

    // Permitir forçar uso do S3 mesmo em desenvolvimento (útil para testes)
    const forceS3 =
      process.env.FORCE_S3 === "true" || process.env.FORCE_S3 === "1";

    // Configurar cliente S3 em produção ou se FORCE_S3 estiver ativado
    if ((this.isProduction || forceS3) && this.isS3Configured()) {
      this.s3Client = new S3Client({
        region: config.AWS_REGION,
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
      });
    }

    // Garantir que a pasta de upload local existe (apenas se não estiver forçando S3)
    if (!this.isProduction && !forceS3) {
      const uploadDir = path.join(__dirname, "../../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }
  }

  /**
   * Verifica se o S3 está configurado corretamente
   */
  isS3Configured() {
    return !!(
      config.AWS_ACCESS_KEY_ID &&
      config.AWS_SECRET_ACCESS_KEY &&
      config.AWS_REGION &&
      config.AWS_S3_BUCKET_NAME
    );
  }

  /**
   * Gera um nome único para o arquivo
   */
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(6).toString("hex");
    const extension = path.extname(originalName);
    return `${timestamp}_${randomSuffix}${extension}`;
  }

  /**
   * Upload de arquivo para S3
   */
  async uploadToS3(fileBuffer, filename, mimetype) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.AWS_S3_BUCKET_NAME,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimetype,
        // Nota: ACL está descontinuado em buckets novos.
        // Para tornar arquivos públicos, configure a política do bucket.
        // Alternativamente, use CloudFront ou presigned URLs.
      });

      await this.s3Client.send(command);

      // Retornar URL pública do arquivo
      // Formato: https://bucket-name.s3.region.amazonaws.com/key
      // Para buckets na us-east-1: https://bucket-name.s3.amazonaws.com/key
      const region = this.config.AWS_REGION;
      const bucket = this.config.AWS_S3_BUCKET_NAME;

      // Formatar URL corretamente baseado na região
      let publicUrl;
      if (region === "us-east-1") {
        // us-east-1 não inclui região na URL
        publicUrl = `https://${bucket}.s3.amazonaws.com/${filename}`;
      } else {
        publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
      }

      return {
        filename,
        url: publicUrl,
        storage: "s3",
      };
    } catch (error) {
      console.error("❌ Erro ao fazer upload para S3:", error);
      throw new Error(`Falha ao fazer upload para S3: ${error.message}`);
    }
  }

  /**
   * Upload de arquivo para armazenamento local
   */
  async uploadToLocal(fileBuffer, filename, originalName) {
    try {
      const uploadDir = path.join(__dirname, "../../uploads");
      const filePath = path.join(uploadDir, filename);

      // Escrever arquivo no disco
      fs.writeFileSync(filePath, fileBuffer);

      // Retornar URL relativa do arquivo
      const url = `/uploads/${filename}`;

      return {
        filename,
        url,
        storage: "local",
        path: filePath,
      };
    } catch (error) {
      console.error("❌ Erro ao salvar arquivo localmente:", error);
      throw new Error(`Falha ao salvar arquivo: ${error.message}`);
    }
  }

  /**
   * Upload de um único arquivo
   *
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} originalName - Nome original do arquivo
   * @param {string} mimetype - Tipo MIME do arquivo
   * @returns {Promise<Object>} Informações do arquivo uploadado
   */
  async uploadFile(fileBuffer, originalName, mimetype) {
    const filename = this.generateUniqueFilename(originalName);

    // Verificar se deve usar S3 (produção ou FORCE_S3=true)
    const forceS3 =
      process.env.FORCE_S3 === "true" || process.env.FORCE_S3 === "1";
    const shouldUseS3 = (this.isProduction || forceS3) && this.isS3Configured();

    if (shouldUseS3) {
      return await this.uploadToS3(fileBuffer, filename, mimetype);
    } else {
      return await this.uploadToLocal(fileBuffer, filename, originalName);
    }
  }

  /**
   * Upload de múltiplos arquivos
   *
   * @param {Array<Object>} files - Array de objetos { buffer, originalname, mimetype }
   * @returns {Promise<Array<Object>>} Array com informações dos arquivos uploadados
   */
  async uploadFiles(files) {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.originalname, file.mimetype)
    );

    return await Promise.all(uploadPromises);
  }

  /**
   * Deletar arquivo do S3
   */
  async deleteFromS3(filename) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.AWS_S3_BUCKET_NAME,
        Key: filename,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error("❌ Erro ao deletar arquivo do S3:", error);
      throw new Error(`Falha ao deletar arquivo do S3: ${error.message}`);
    }
  }

  /**
   * Deletar arquivo do armazenamento local
   */
  async deleteFromLocal(filename) {
    try {
      const filePath = path.join(__dirname, "../../uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Erro ao deletar arquivo local:", error);
      throw new Error(`Falha ao deletar arquivo local: ${error.message}`);
    }
  }

  /**
   * Deletar um arquivo (S3 ou local, dependendo do storage)
   *
   * @param {string} filename - Nome do arquivo
   * @param {string} storage - Tipo de armazenamento ('s3' ou 'local')
   */
  async deleteFile(filename, storage = null) {
    // Se storage não foi especificado, determinar baseado no ambiente
    if (!storage) {
      storage = this.isProduction && this.isS3Configured() ? "s3" : "local";
    }

    if (storage === "s3") {
      return await this.deleteFromS3(filename);
    } else {
      return await this.deleteFromLocal(filename);
    }
  }

  /**
   * Obter URL completa de um arquivo
   *
   * @param {string} filename - Nome do arquivo
   * @param {string} storage - Tipo de armazenamento ('s3' ou 'local')
   * @returns {string} URL completa do arquivo
   */
  getFileUrl(filename, storage = null) {
    // Se storage não foi especificado, determinar baseado no ambiente
    if (!storage) {
      const forceS3 =
        process.env.FORCE_S3 === "true" || process.env.FORCE_S3 === "1";
      const shouldUseS3 =
        (this.isProduction || forceS3) && this.isS3Configured();
      storage = shouldUseS3 ? "s3" : "local";
    }

    if (storage === "s3") {
      const region = this.config.AWS_REGION;
      const bucket = this.config.AWS_S3_BUCKET_NAME;

      // Formatar URL corretamente baseado na região
      if (region === "us-east-1") {
        // us-east-1 não inclui região na URL
        return `https://${bucket}.s3.amazonaws.com/${filename}`;
      } else {
        return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
      }
    } else {
      return `/uploads/${filename}`;
    }
  }
}

// Exportar instância singleton
module.exports = new UploadService();
