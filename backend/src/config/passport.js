const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Carregar variáveis diretamente do process.env
const config = require("./env");
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackURL =
  process.env.GOOGLE_CALLBACK_URL || config.GOOGLE_CALLBACK_URL;

// VALIDAÇÃO PARA EVITAR CRASH
if (!googleClientId || !googleClientSecret) {
  console.warn("⚠️  Google OAuth não configurado - desabilitado");
  console.warn("   Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env");
  console.warn("   Rotas /api/auth/google não estarão disponíveis");
  // Retornar passport sem strategy configurada
  // Isso permite que o servidor inicie normalmente sem OAuth
  module.exports = passport;
} else {
  console.log("✅ Google OAuth configurado");
  console.log(`   Callback URL: ${googleCallbackURL}`);

  /**
   * Configuração do Passport.js para Google OAuth 2.0
   *
   * Strategy: Google OAuth 2.0
   * Scopes: profile, email (obrigatórios)
   */
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔵 Passport Google Strategy - Perfil recebido:", {
            id: profile.id,
            displayName: profile.displayName,
            emails: profile.emails,
            photos: profile.photos,
          });

          // Passport chama esta função após o usuário autorizar no Google
          // profile contém: id, displayName, emails, photos

          const googleId = profile.id;
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : null;
          const name = profile.displayName || profile.name?.givenName || "";
          const picture =
            profile.photos && profile.photos[0]
              ? profile.photos[0].value
              : null;

          console.log("📦 Dados extraídos do perfil:", {
            googleId,
            email,
            name,
            picture: picture ? "presente" : "ausente",
          });

          // Validar email
          if (!email) {
            console.error("❌ Email não encontrado no perfil do Google");
            return done(
              new Error("Email não encontrado no perfil do Google"),
              null
            );
          }

          const userData = {
            googleId,
            email: email.toLowerCase().trim(),
            name,
            picture,
            accessToken,
            refreshToken,
          };

          console.log("✅ Retornando dados para callback:", userData);

          // Retornar dados do Google para processamento no callback
          return done(null, userData);
        } catch (error) {
          console.error("❌ Erro na estratégia Google OAuth:", error);
          return done(error, null);
        }
      }
    )
  );

  // Serialização do usuário (não usado com JWT stateless, mas necessário para Passport)
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  module.exports = passport;
}
