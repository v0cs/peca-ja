/**
 * Configuração do Jest para testes do backend
 * 
 * IMPORTANTE: Não usa Babel - Jest v30+ suporta JavaScript moderno nativamente
 * - A configuração 'transform: {}' desabilita explicitamente o uso do Babel
 * - Todos os testes usam JavaScript vanilla compatível com Node.js nativo
 * - Sem arquivos babel.config.* necessários
 */

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
    "!src/migrations/**",
    "!src/seeders/**",
    "!src/tests/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  // ✅ CONFIGURAÇÃO ESSENCIAL - Desabilita Babel explicitamente
  // Com transform: {}, o Jest não tentará usar nenhum transform, incluindo Babel
  transform: {},
  // Configurações para melhorar performance e estabilidade
  maxWorkers: "50%", // Usa metade dos workers disponíveis para evitar sobrecarga
  maxConcurrency: 5, // Limita testes concorrentes
  // Limpa mocks automaticamente entre testes
  clearMocks: true,
  resetMocks: false, // Não reseta mocks automaticamente (preserva implementações)
  restoreMocks: false, // Não restaura mocks automaticamente
  // Detecta memory leaks
  detectOpenHandles: false, // Desabilitado para evitar warnings desnecessários em testes unitários
  forceExit: false, // Não força saída
  // coverageThreshold: {
  //   // Thresholds desabilitados temporariamente para novos controllers
  //   // Serão reabilitados quando todos os controllers tiverem testes
  // },
};
