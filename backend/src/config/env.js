module.exports = {
  // Server Configuration
  NODE_ENV: "development",
  PORT: 3001,

  // Database Configuration
  DB_HOST: "localhost",
  DB_PORT: 5432,
  DB_NAME: "pecaja",
  DB_USER: "postgres",
  DB_PASSWORD: "banco123",

  // JWT Configuration
  JWT_SECRET: "pecaja-super-secret-jwt-key-change-this-in-production-2024",
  JWT_EXPIRES_IN: "24h",

  // Frontend URL
  FRONTEND_URL: "http://localhost:3000",

  // File Upload Configuration
  MAX_FILE_SIZE: 10485760, // 10MB
  UPLOAD_PATH: "./uploads",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,

  // API Veicular Configuration
  API_VEICULAR_KEY:
    process.env.API_VEICULAR_KEY || "c68ed7cedc6d247491a1cd0561b30d16",
  API_VEICULAR_EMAIL:
    process.env.API_VEICULAR_EMAIL || "vitorcelestinosilva@gmail.com",
  API_VEICULAR_BASE_URL: "https://api.consultarplaca.com.br/v2",
  API_VEICULAR_TIMEOUT: 10000, // 10 seconds
  API_VEICULAR_CACHE_TTL: 86400, // 24 hours
};
