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
};
