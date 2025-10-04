const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware");

// Rota para registro de usuários
router.post("/register", authController.register);

// Rota para registro de autopeças
router.post("/register-autopeca", authController.registerAutopeca);

// Rota para login de usuários
router.post("/login", authController.login);

// Rota para solicitar recuperação de senha
router.post("/forgot-password", authController.forgotPassword);

// Rota para redefinir senha com token
router.post("/reset-password", authController.resetPassword);

// Rota protegida para obter informações do usuário logado
router.get("/me", authMiddleware, authController.me);

module.exports = router;
