const rateLimit = require("express-rate-limit");
const config = require("../config/env");

/**
 * Rate Limiting Middleware
 * 
 * Implementa diferentes níveis de rate limiting baseado no tipo de endpoint:
 * - Geral: Para todas as rotas (padrão)
 * - Auth: Para endpoints de autenticação (mais restritivo)
 * - API: Para endpoints de API (mais permissivo)
 * - Upload: Para endpoints de upload de arquivos (muito restritivo)
 */

/**
 * Helper para obter IP do cliente
 * Considera proxies reversos e load balancers
 */
const getClientIp = (req) => {
  return (
    req.ip ||
    (req.connection && req.connection.remoteAddress) ||
    (req.socket && req.socket.remoteAddress) ||
    (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
    (req.headers["x-forwarded-for"] && typeof req.headers["x-forwarded-for"] === "string" && req.headers["x-forwarded-for"].split(",")[0].trim()) ||
    req.headers["x-real-ip"] ||
    "unknown"
  );
};

/**
 * Handler de erro personalizado para rate limiting
 */
const rateLimitHandler = (req, res) => {
  const retryAfter = Math.ceil(
    (req.rateLimit.resetTime - Date.now()) / 1000
  );
  
  res.status(429).json({
    success: false,
    message: "Muitas requisições. Tente novamente mais tarde.",
    error: "Rate limit excedido",
    retryAfter: retryAfter,
    limit: req.rateLimit.limit,
    remaining: 0,
    resetTime: new Date(req.rateLimit.resetTime).toISOString(),
  });
};

/**
 * Rate Limiter Geral (Global)
 * Aplicado a todas as rotas por padrão
 * Limite maior para usuários autenticados (permite carregamento de dashboards)
 */
const generalRateLimiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: (req) => {
    // Aumentar limite para usuários autenticados (permite carregamento de dashboards com múltiplas requisições)
    if (req.user && req.user.userId) {
      // Em desenvolvimento, limite muito maior para permitir testes e múltiplos logins
      if (config.NODE_ENV === "development" || !config.isProduction) {
        return parseInt(config.RATE_LIMIT_MAX_REQUESTS) * 10 || 1000; // 10x mais em desenvolvimento
      }
      return parseInt(config.RATE_LIMIT_MAX_REQUESTS) * 3 || 300; // 3x mais para usuários autenticados em produção
    }
    // Para não autenticados, também aumentar em desenvolvimento
    if (config.NODE_ENV === "development" || !config.isProduction) {
      return parseInt(config.RATE_LIMIT_MAX_REQUESTS) * 5 || 500; // 5x mais em desenvolvimento
    }
    return parseInt(config.RATE_LIMIT_MAX_REQUESTS) || 100; // Limite padrão para não autenticados em produção
  },
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
  standardHeaders: true, // Retorna informações de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  handler: rateLimitHandler,
  skip: (req) => {
    // Pular rate limiting para:
    // - Health checks
    // - OAuth redirects (GET /auth/google e /auth/google/callback)
    // - GET /auth/me (rota autenticada essencial, não representa risco de abuso)
    const isHealthCheck = req.path === "/health" || req.path === "/api/health";
    const isOAuthRedirect = 
      req.path === "/api/auth/google" || 
      req.path === "/auth/google" ||
      req.path === "/api/auth/google/callback" ||
      req.path === "/auth/google/callback";
    
    // Excluir /auth/me do rate limiting global - é uma rota autenticada essencial
    // Usada frequentemente para verificar status do usuário e após OAuth
    const isAuthMe = 
      req.path === "/api/auth/me" || 
      req.path === "/auth/me";
    
    return isHealthCheck || isOAuthRedirect || isAuthMe;
  },
  keyGenerator: (req) => {
    // Usar IP do cliente ou user ID se autenticado
    if (req.user && req.user.userId) {
      return `user:${req.user.userId}`;
    }
    return getClientIp(req);
  },
  skipSuccessfulRequests: false, // Contar todas as requisições
  skipFailedRequests: false, // Contar todas as requisições
});

/**
 * Rate Limiter para Autenticação
 * Mais restritivo para prevenir brute force
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(config.RATE_LIMIT_AUTH_MAX) || (config.isProduction ? 10 : 20), // Usar valor do config (aumentado para ser mais tolerante)
  message: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Usar IP para autenticação (mais restritivo - mesmo usuário pode ter múltiplas tentativas)
    return `auth:${getClientIp(req)}`;
  },
  skipSuccessfulRequests: true, // Não contar tentativas bem-sucedidas (permite múltiplos logins bem-sucedidos)
  skipFailedRequests: false, // Contar tentativas falhadas (para prevenir brute force)
});

/**
 * Rate Limiter para Endpoints de API
 * Mais permissivo para uso normal da API
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(config.RATE_LIMIT_API_MAX) || (config.isProduction ? 200 : 500), // Usar valor do config
  message: "Limite de requisições da API excedido. Tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `api:user:${req.user.userId}`;
    }
    return `api:${getClientIp(req)}`;
  },
});

/**
 * Rate Limiter para Upload de Arquivos
 * Muito restritivo para prevenir abuso
 */
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: parseInt(config.RATE_LIMIT_UPLOAD_MAX) || (config.isProduction ? 10 : 20), // Usar valor do config
  message: "Limite de uploads excedido. Tente novamente em 1 hora.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `upload:user:${req.user.userId}`;
    }
    return `upload:${getClientIp(req)}`;
  },
});

/**
 * Rate Limiter para Criação de Solicitações
 * Restritivo para prevenir spam
 */
const solicitationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: parseInt(config.RATE_LIMIT_SOLICITATION_MAX) || (config.isProduction ? 10 : 20), // Usar valor do config
  message: "Limite de criação de solicitações excedido. Tente novamente em 1 hora.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `solicitation:user:${req.user.userId}`;
    }
    return `solicitation:${getClientIp(req)}`;
  },
});

/**
 * Rate Limiter para Cadastro de Vendedores
 * Restritivo para prevenir criação em massa
 */
const vendedorCreationRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: parseInt(config.RATE_LIMIT_VENDEDOR_MAX) || (config.isProduction ? 5 : 10), // Usar valor do config
  message: "Limite de cadastro de vendedores excedido. Tente novamente amanhã.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `vendedor:user:${req.user.userId}`;
    }
    return `vendedor:${getClientIp(req)}`;
  },
});

module.exports = {
  generalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  solicitationRateLimiter,
  vendedorCreationRateLimiter,
  getClientIp, // Exportar para uso em outros lugares se necessário
};

