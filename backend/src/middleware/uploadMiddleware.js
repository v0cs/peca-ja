const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Criar diretório uploads se não existir
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único: timestamp + número aleatório + extensão original
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 10000);
    const extension = path.extname(file.originalname);
    const uniqueName = `${timestamp}_${randomNumber}${extension}`;
    cb(null, uniqueName);
  },
});

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

// Middleware wrapper com tratamento de erros
const uploadMiddleware = (req, res, next) => {
  uploadImages(req, res, (err) => {
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
      if (err.message.includes("Tipo de arquivo não permitido")) {
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

    // Adicionar informações dos arquivos ao request
    req.uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    }));

    next();
  });
};

// Middleware para upload de uma única imagem
const uploadSingleImage = upload.single("image");

const uploadSingleMiddleware = (req, res, next) => {
  uploadSingleImage(req, res, (err) => {
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
      if (err.message.includes("Tipo de arquivo não permitido")) {
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

    // Adicionar informações do arquivo ao request
    req.uploadedFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    };

    next();
  });
};

module.exports = {
  uploadMiddleware,
  uploadSingleMiddleware,
  upload,
};
