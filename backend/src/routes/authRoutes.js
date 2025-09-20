const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware");

// Rota para registro de usuários
router.post("/register", authController.register);

// Rota para login de usuários
router.post("/login", authController.login);

// Rota protegida para obter informações do usuário logado
router.get("/me", authMiddleware, authController.me);

module.exports = router;
