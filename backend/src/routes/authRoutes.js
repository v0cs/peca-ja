const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const authController = require("../controllers/authController");
const { authMiddleware, authRateLimiter } = require("../middleware");

// Aplicar rate limiting específico para autenticação
// (mais restritivo para prevenir brute force)
router.post("/register", authRateLimiter, authController.register);
router.post("/register-autopeca", authRateLimiter, authController.registerAutopeca);
router.post("/login", authRateLimiter, authController.login);
router.post("/forgot-password", authRateLimiter, authController.forgotPassword);
router.post("/reset-password", authRateLimiter, authController.resetPassword);

// Rotas Google OAuth 2.0
// Inicia o fluxo OAuth - redireciona para Google
// NÃO aplicar rate limiting aqui - é um redirecionamento GET
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // Não usar sessões, vamos usar JWT
  })
);

// Callback do Google - recebe autorização
// NÃO aplicar rate limiting aqui - já passou pelo geral e é um redirecionamento
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=oauth_failed",
    session: false,
  }),
  authController.googleCallback
);

// Rota protegida para obter informações do usuário logado
router.get("/me", authMiddleware, authController.me);

// Rota protegida para logout de usuário
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
