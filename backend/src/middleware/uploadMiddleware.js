const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadService = require("../services/uploadService");

// Filtro para validar tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  // Validar extensão do arquivo
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(
      new Error(
        `Extensão de arquivo não permitida: ${fileExtension}. Apenas .jpg, .jpeg, .png e .webp são aceitos.`
      ),
      false
    );
  }

  // Validar MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Tipo de arquivo não permitido. Apenas JPEG, PNG e WebP são aceitos."
      ),
      false
    );
  }

  // Verificar se a extensão corresponde ao MIME type (validação adicional de segurança)
  const extensionToMime = {
    ".jpg": ["image/jpeg", "image/jpg"],
    ".jpeg": ["image/jpeg", "image/jpg"],
    ".png": ["image/png"],
    ".webp": ["image/webp"],
  };

  const expectedMimes = extensionToMime[fileExtension] || [];
  if (expectedMimes.length > 0 && !expectedMimes.includes(file.mimetype)) {
    return cb(
      new Error(
        `Extensão do arquivo (${fileExtension}) não corresponde ao tipo MIME (${file.mimetype}). Arquivo pode estar corrompido ou malicioso.`
      ),
      false
    );
  }

  cb(null, true);
};

// Usar memoryStorage para armazenar arquivos em memória temporariamente
// Isso permite fazer upload para S3 ou salvar localmente após processamento
const storage = multer.memoryStorage();

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por arquivo
    files: 3, // Máximo 3 arquivos por solicitação
  },
});

// Middleware para upload de múltiplas imagens
const uploadImages = upload.array("images", 3);

// Middleware wrapper com tratamento de erros e integração com serviço de upload
const uploadMiddleware = async (req, res, next) => {
  uploadImages(req, res, async (err) => {
    if (err) {
      // Tratar diferentes tipos de erro
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message:
              "Arquivo muito grande. Tamanho máximo permitido: 5MB por imagem.",
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message:
              "Muitos arquivos. Máximo permitido: 3 imagens por solicitação.",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: 'Campo de arquivo inesperado. Use o campo "images".',
          });
        }
      }

      // Erro de validação de tipo de arquivo
      if (err.message && err.message.includes("Tipo de arquivo não permitido")) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Outros erros
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor durante o upload.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }

    // Verificar se arquivos foram enviados (opcional)
    if (!req.files || req.files.length === 0) {
      req.uploadedFiles = [];
      return next();
    }

    try {
      // Processar cada arquivo através do serviço de upload
      const uploadPromises = req.files.map(async (file) => {
        const uploadResult = await uploadService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        return {
          filename: uploadResult.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: uploadResult.url,
          storage: uploadResult.storage,
          path: uploadResult.path || null, // Pode ser null se estiver no S3
        };
      });

      req.uploadedFiles = await Promise.all(uploadPromises);
      next();
    } catch (uploadError) {
      console.error("❌ Erro ao fazer upload dos arquivos:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Erro ao processar upload dos arquivos.",
        error: process.env.NODE_ENV === "development" ? uploadError.message : undefined,
      });
    }
  });
};

// Middleware para upload de uma única imagem
const uploadSingleImage = upload.single("image");

const uploadSingleMiddleware = async (req, res, next) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      // Tratar diferentes tipos de erro
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Arquivo muito grande. Tamanho máximo permitido: 5MB.",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: 'Campo de arquivo inesperado. Use o campo "image".',
          });
        }
      }

      // Erro de validação de tipo de arquivo
      if (err.message && err.message.includes("Tipo de arquivo não permitido")) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Outros erros
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor durante o upload.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }

    // Verificar se arquivo foi enviado
    if (!req.file) {
      req.uploadedFile = null;
      return next();
    }

    try {
      // Processar arquivo através do serviço de upload
      const uploadResult = await uploadService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      req.uploadedFile = {
        filename: uploadResult.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: uploadResult.url,
        storage: uploadResult.storage,
        path: uploadResult.path || null, // Pode ser null se estiver no S3
      };

      next();
    } catch (uploadError) {
      console.error("❌ Erro ao fazer upload do arquivo:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Erro ao processar upload do arquivo.",
        error: process.env.NODE_ENV === "development" ? uploadError.message : undefined,
      });
    }
  });
};

module.exports = {
  uploadMiddleware,
  uploadSingleMiddleware,
  upload,
};
