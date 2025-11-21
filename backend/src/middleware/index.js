// middleware/index.js
const authMiddleware = require("./authMiddleware");
const {
  uploadMiddleware,
  uploadSingleMiddleware,
} = require("./uploadMiddleware");
const {
  consultaVeicularMiddleware,
  consultaVeicularSolicitacoesMiddleware,
  logConsultaVeicularMiddleware,
} = require("./consultaVeicularMiddleware");
const {
  generalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  solicitationRateLimiter,
  vendedorCreationRateLimiter,
} = require("./rateLimitMiddleware");

module.exports = {
  authMiddleware,
  uploadMiddleware,
  uploadSingleMiddleware,
  consultaVeicularMiddleware,
  consultaVeicularSolicitacoesMiddleware,
  logConsultaVeicularMiddleware,
  generalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  solicitationRateLimiter,
  vendedorCreationRateLimiter,
};
