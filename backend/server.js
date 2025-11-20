// Carregar variáveis de ambiente PRIMEIRO (antes de qualquer importação)
// Procurar .env primeiro na raiz do projeto, depois em backend/
const path = require("path");
const fs = require("fs");

// Tentar carregar .env da raiz do projeto primeiro, depois de backend/
const rootEnvPath = path.join(__dirname, "..", ".env");
const backendEnvPath = path.join(__dirname, ".env");

const envPath = fs.existsSync(rootEnvPath) ? rootEnvPath : backendEnvPath;

// Debug: mostrar qual arquivo está sendo carregado
if (fs.existsSync(rootEnvPath)) {
  console.log(`📄 Carregando .env de: ${rootEnvPath}`);
} else if (fs.existsSync(backendEnvPath)) {
  console.log(`📄 Carregando .env de: ${backendEnvPath}`);
} else {
  console.warn(`⚠️  Arquivo .env não encontrado em: ${rootEnvPath} ou ${backendEnvPath}`);
}

// CORREÇÃO: Converter arquivo UTF-16 para UTF-8 se necessário
if (fs.existsSync(envPath)) {
  try {
    // Tentar ler como UTF-8 primeiro
    let content = fs.readFileSync(envPath, "utf8");
    
    // Se o conteúdo parece estar em UTF-16 (tem \x00 entre caracteres), converter
    if (content.includes("\x00")) {
      console.log("⚠️  Arquivo .env está em UTF-16. Convertendo para UTF-8...");
      // Ler como UTF-16LE e converter para UTF-8
      const buffer = fs.readFileSync(envPath);
      // Remover BOM se existir e converter
      content = buffer.toString("utf16le").replace(/^\ufeff/, "");
      // Salvar como UTF-8
      fs.writeFileSync(envPath, content, "utf8");
      console.log("✅ Arquivo .env convertido para UTF-8");
    }
  } catch (error) {
    console.warn(`⚠️  Aviso ao processar .env: ${error.message}`);
  }
}

const result = require("dotenv").config({ path: envPath });

// Debug: mostrar quantas variáveis foram carregadas
if (result.parsed) {
  const googleVars = Object.keys(result.parsed).filter(key => key.includes("GOOGLE"));
  console.log(`✅ ${Object.keys(result.parsed).length} variáveis carregadas do .env`);
  if (googleVars.length > 0) {
    console.log(`   Variáveis Google encontradas: ${googleVars.join(", ")}`);
  }
} else if (result.error) {
  console.error(`❌ Erro ao carregar .env: ${result.error.message}`);
} else {
  console.warn(`⚠️  Nenhuma variável foi carregada do .env. Verifique o formato do arquivo (deve ser UTF-8).`);
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Importar configuração centralizada
const config = require("./src/config/env");

// Importar conexão do banco de dados
const { sequelize } = require("./src/config/database");

// Importar e inicializar Passport para OAuth
require("./src/config/passport");

// Importar todas as rotas organizadas
const routes = require("./src/routes");

const app = express();
const PORT = config.PORT;

// Middlewares
// Configurar helmet para permitir imagens de uploads
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// Configurar CORS dinamicamente baseado em ambiente
const corsOptions = {
  origin: config.isProduction
    ? [
        `https://${config.domain}`,
        `https://www.${config.domain}`,
        config.frontendURL,
      ].filter(Boolean)
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
      ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Configurar todas as rotas com prefixo /api
app.use("/api", routes);

// Servir arquivos estáticos da pasta uploads (caminho absoluto)
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));
console.log(`📁 Servindo arquivos estáticos de: ${uploadsDir}`);

// Health check básico
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend simplificado funcionando!" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo deu errado!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Inicialização do servidor
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com PostgreSQL estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar com PostgreSQL:", error.message);
  }

  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/google`);
  console.log(`   GET  /api/auth/google/callback`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   POST /api/solicitacoes`);
  console.log(`   GET  /api/solicitacoes`);
  console.log(`   GET  /api/solicitacoes/:id`);
  console.log(`   PUT  /api/solicitacoes/:id`);
  console.log(`   DELETE /api/solicitacoes/:id`);
  console.log(`   GET  /health`);
});
