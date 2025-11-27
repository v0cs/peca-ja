const config = require("../config/env");

/**
 * Configura e define um cookie httpOnly seguro para autenticação
 * @param {Object} res - Response object do Express
 * @param {string} token - JWT token a ser armazenado
 */
const setAuthCookie = (res, token) => {
  const isProduction = config.isProduction;
  const protocol = process.env.PROTOCOL || (isProduction ? "http" : "http");
  const secure = protocol === "https";

  // Para cross-origin cookies, SameSite deve ser "lax" ou "none" (com secure)
  // "strict" bloqueia cookies em cross-origin, mas é mais seguro
  // Se frontend e backend estiverem em domínios diferentes, usar "lax"
  const sameSite = isProduction && secure ? "lax" : "lax";

  res.cookie("authToken", token, {
    httpOnly: true, // Não acessível via JavaScript (proteção XSS)
    secure: secure, // Apenas HTTPS quando PROTOCOL=https
    sameSite: sameSite, // "lax" permite cookies em cross-origin para navegação top-level
    maxAge: 24 * 60 * 60 * 1000, // 24 horas (mesmo tempo do JWT)
    path: "/", // Disponível em todo o site
    // Em produção com domínios diferentes, pode ser necessário ajustar domain
    // domain: config.isProduction ? `.${config.domain}` : undefined,
  });
};

/**
 * Remove o cookie de autenticação
 * @param {Object} res - Response object do Express
 */
const clearAuthCookie = (res) => {
  const isProduction = config.isProduction;
  const protocol = process.env.PROTOCOL || (isProduction ? "http" : "http");
  const secure = protocol === "https";
  const sameSite = isProduction && secure ? "lax" : "lax";

  res.clearCookie("authToken", {
    httpOnly: true,
    secure: secure,
    sameSite: sameSite,
    path: "/",
  });
};

module.exports = {
  setAuthCookie,
  clearAuthCookie,
};

