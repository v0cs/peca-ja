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

module.exports = {
  authMiddleware,
  uploadMiddleware,
  uploadSingleMiddleware,
  consultaVeicularMiddleware,
  consultaVeicularSolicitacoesMiddleware,
  logConsultaVeicularMiddleware,
};
