// Setup global para os testes
require("dotenv").config({ path: ".env.test" });

// Configurações globais para testes
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";

// Configurações de banco de dados para testes (mock)
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_NAME = "pecaja_test_mock";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";

// Timeout global para testes
jest.setTimeout(30000);

// Mock do console.log para evitar spam durante os testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
