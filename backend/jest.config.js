module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  // Não usar Babel - Jest v30+ suporta JavaScript moderno nativamente
  // Sem configuração de transform, o Jest usa seu transform padrão sem Babel
  // coverageThreshold: {
  //   // Thresholds desabilitados temporariamente para novos controllers
  //   // Serão reabilitados quando todos os controllers tiverem testes
  // },
};
