const express = require("express");
const path = require("path");
const {
  uploadMiddleware,
  uploadSingleMiddleware,
} = require("./src/middleware/uploadMiddleware");

const app = express();
const PORT = 3001;

// Middleware para parsing de JSON
app.use(express.json());

// Rota para testar upload de múltiplas imagens
app.post("/test-upload-multiple", uploadMiddleware, (req, res) => {
  try {
    console.log("Arquivos enviados:", req.uploadedFiles);

    res.json({
      success: true,
      message: "Upload realizado com sucesso!",
      files: req.uploadedFiles.map((file) => ({
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
      })),
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Rota para testar upload de uma única imagem
app.post("/test-upload-single", uploadSingleMiddleware, (req, res) => {
  try {
    console.log("Arquivo enviado:", req.uploadedFile);

    res.json({
      success: true,
      message: "Upload realizado com sucesso!",
      file: {
        filename: req.uploadedFile.filename,
        originalName: req.uploadedFile.originalName,
        size: req.uploadedFile.size,
        mimetype: req.uploadedFile.mimetype,
      },
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Rota para servir arquivos estáticos (para visualizar as imagens)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rota de teste básica
app.get("/test", (req, res) => {
  res.json({
    message: "Servidor de teste do middleware de upload funcionando!",
    endpoints: {
      "POST /test-upload-multiple": "Upload de até 3 imagens (campo: images)",
      "POST /test-upload-single": "Upload de 1 imagem (campo: image)",
      "GET /uploads/:filename": "Visualizar imagem enviada",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
  console.log(
    `Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log(
    "\nPara testar o upload, use uma ferramenta como Postman ou curl:"
  );
  console.log(
    'curl -X POST -F "images=@caminho/para/imagem1.jpg" -F "images=@caminho/para/imagem2.png" http://localhost:3001/test-upload-multiple'
  );
});
