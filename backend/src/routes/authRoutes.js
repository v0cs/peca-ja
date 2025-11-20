const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware");

// Rota para registro de usuários
router.post("/register", authController.register);

// Rota para registro de autopeças
router.post("/register-autopeca", authController.registerAutopeca);

// Rota para login de usuários
router.post("/login", authController.login);

// Rotas Google OAuth 2.0
// Inicia o fluxo OAuth - redireciona para Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // Não usar sessões, vamos usar JWT
  })
);

// Callback do Google - recebe autorização
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=oauth_failed",
    session: false,
  }),
  authController.googleCallback
);

// Rota para solicitar recuperação de senha
router.post("/forgot-password", authController.forgotPassword);

// Rota para redefinir senha com token
router.post("/reset-password", authController.resetPassword);

// Rota protegida para obter informações do usuário logado
router.get("/me", authMiddleware, authController.me);

// Rota protegida para logout de usuário
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
