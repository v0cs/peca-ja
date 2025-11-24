// Configuração dinâmica baseada em ambiente
const isProduction = process.env.NODE_ENV === "production";

// Configuração de URLs e domínios
const getBaseConfig = () => {
  if (isProduction) {
    const domain = process.env.DOMAIN || "pecaja.cloud";
    return {
      domain,
      baseURL: process.env.BASE_URL || `https://${domain}`,
      frontendURL: process.env.FRONTEND_URL || `https://${domain}`,
      // API pode estar no mesmo domínio (/api) ou em subdomínio (api.pecaja.cloud)
      apiURL: process.env.API_URL || `https://api.${domain}`,
      // EMAIL_FROM: Deve usar o domínio verificado no Resend
      // Formato: "PeçaJá <noreply@seudominio.com>" ou "PeçaJá <contato@seudominio.com>"
      // Se não especificado, usa contato@[domain] com nome "PeçaJá"
      emailFrom: process.env.EMAIL_FROM || `PeçaJá <contato@${domain}>`,
    };
  }

  // Desenvolvimento
  return {
    domain: "localhost",
    baseURL: process.env.APP_URL || "http://localhost:3000",
    frontendURL: process.env.FRONTEND_URL || "http://localhost:5173",
    apiURL: process.env.API_URL || "http://localhost:3001/api",
    // Em desenvolvimento, usa o domínio padrão do Resend para testes
    emailFrom: process.env.EMAIL_FROM || "PeçaJá <onboarding@resend.dev>",
  };
};

const baseConfig = getBaseConfig();

// Validação de variáveis críticas obrigatórias (apenas em produção)
const validateRequiredEnvVars = () => {
  if (!isProduction) {
    // Em desenvolvimento, apenas avisar se faltar variáveis
    const warnings = [];

    if (!process.env.JWT_SECRET) {
      warnings.push(
        "⚠️  JWT_SECRET: Não configurado. Configure no arquivo .env para desenvolvimento."
      );
    }

    if (!process.env.DB_PASSWORD) {
      warnings.push(
        "⚠️  DB_PASSWORD: Não configurado. Configure no arquivo .env para desenvolvimento."
      );
    }

    if (!process.env.RESEND_API_KEY) {
      warnings.push(
        "⚠️  RESEND_API_KEY: Não configurado. Configure no arquivo .env para desenvolvimento."
      );
    }

    if (warnings.length > 0) {
      console.warn(
        "\n⚠️  AVISO: Algumas variáveis de ambiente não estão configuradas:\n"
      );
      warnings.forEach((warning) => console.warn(`  ${warning}`));
      console.warn(
        "\n📖 Consulte CONFIGURACAO-AMBIENTE.md para mais informações.\n"
      );
    }
    return;
  }

  // Em produção, exigir todas as variáveis
  const errors = [];

  if (!process.env.JWT_SECRET) {
    errors.push(
      "❌ JWT_SECRET: Variável de ambiente obrigatória! Use: openssl rand -base64 64"
    );
  }

  if (!process.env.DB_PASSWORD) {
    errors.push(
      "❌ DB_PASSWORD: Variável de ambiente obrigatória! Use uma senha forte."
    );
  }

  if (!process.env.RESEND_API_KEY) {
    errors.push(
      "❌ RESEND_API_KEY: Variável de ambiente obrigatória! Obtenha em: https://resend.com/api-keys"
    );
  }

  if (errors.length > 0) {
    console.error(
      "\n🚨 ERRO: Variáveis de ambiente obrigatórias não configuradas para produção:\n"
    );
    errors.forEach((error) => console.error(`  ${error}`));
    console.error(
      "\n📖 Consulte CONFIGURACAO-AMBIENTE.md para mais informações.\n"
    );
    process.exit(1);
  }
};

// Validar variáveis obrigatórias
validateRequiredEnvVars();

module.exports = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3001,
  isProduction,

  // Base Configuration (URLs dinâmicas)
  ...baseConfig,

  // Database Configuration
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || "pecaja",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",

  // File Upload Configuration
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10485760, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || "./uploads",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  RATE_LIMIT_AUTH_MAX:
    process.env.RATE_LIMIT_AUTH_MAX || (isProduction ? 10 : 20), // Tentativas de auth (aumentado para ser mais tolerante)
  RATE_LIMIT_API_MAX:
    process.env.RATE_LIMIT_API_MAX || (isProduction ? 200 : 500), // Requisições API
  RATE_LIMIT_UPLOAD_MAX:
    process.env.RATE_LIMIT_UPLOAD_MAX || (isProduction ? 10 : 20), // Uploads por hora
  RATE_LIMIT_SOLICITATION_MAX:
    process.env.RATE_LIMIT_SOLICITATION_MAX || (isProduction ? 10 : 20), // Solicitações por hora
  RATE_LIMIT_VENDEDOR_MAX:
    process.env.RATE_LIMIT_VENDEDOR_MAX || (isProduction ? 5 : 10), // Cadastros por dia

  // API Veicular Configuration
  API_VEICULAR_KEY: process.env.API_VEICULAR_KEY,
  API_VEICULAR_EMAIL: process.env.API_VEICULAR_EMAIL,
  API_VEICULAR_BASE_URL: "https://api.consultarplaca.com.br/v2",
  API_VEICULAR_TIMEOUT: 10000, // 10 seconds
  API_VEICULAR_CACHE_TTL: 86400, // 24 hours

  // Email Configuration (Resend)
  RESEND_API_KEY: process.env.RESEND_API_KEY,

  // Google OAuth 2.0 Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    (isProduction
      ? `${baseConfig.apiURL}/auth/google/callback`
      : "http://localhost:3001/api/auth/google/callback"),
};
