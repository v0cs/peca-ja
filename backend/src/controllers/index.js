// Controllers index file
// Export all controllers from here

const AuthController = require("./authController");
const SolicitacaoController = require("./solicitacaoController");
const NotificationController = require("./notificationController");
const AutopecaController = require("./autopecaController");
const ClienteController = require("./clienteController");
const UsuarioController = require("./usuarioController");
const VehicleController = require("./vehicleController");
const VendedorController = require("./vendedorController");
const VendedorOperacoesController = require("./vendedorOperacoesController");

module.exports = {
  AuthController,
  SolicitacaoController,
  NotificationController,
  AutopecaController,
  ClienteController,
  UsuarioController,
  VehicleController,
  VendedorController,
  VendedorOperacoesController,
};
