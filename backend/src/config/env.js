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
      emailFrom: process.env.EMAIL_FROM || `contato@${domain}`,
    };
  }

  // Desenvolvimento
  return {
    domain: "localhost",
    baseURL: process.env.APP_URL || "http://localhost:3000",
    frontendURL: process.env.FRONTEND_URL || "http://localhost:5173",
    apiURL: process.env.API_URL || "http://localhost:3001/api",
    emailFrom: process.env.EMAIL_FROM || "PeçaJá <onboarding@resend.dev>",
  };
};

const baseConfig = getBaseConfig();

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
  DB_PASSWORD: process.env.DB_PASSWORD || "banco123",

  // JWT Configuration
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "pecaja-super-secret-jwt-key-change-this-in-production-2024",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",

  // File Upload Configuration
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10485760, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || "./uploads",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,

  // API Veicular Configuration
  API_VEICULAR_KEY:
    process.env.API_VEICULAR_KEY || "c68ed7cedc6d247491a1cd0561b30d16",
  API_VEICULAR_EMAIL:
    process.env.API_VEICULAR_EMAIL || "vitorcelestinosilva@gmail.com",
  API_VEICULAR_BASE_URL: "https://api.consultarplaca.com.br/v2",
  API_VEICULAR_TIMEOUT: 10000, // 10 seconds
  API_VEICULAR_CACHE_TTL: 86400, // 24 hours

  // Email Configuration (Resend)
  RESEND_API_KEY:
    process.env.RESEND_API_KEY || "re_mU2nKnP6_ESPokZgH4y3FB7XJSvAPwu1r",

  // Google OAuth 2.0 Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    (isProduction
      ? `${baseConfig.apiURL}/auth/google/callback`
      : "http://localhost:3001/api/auth/google/callback"),
};
