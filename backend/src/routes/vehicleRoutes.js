const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const VehicleController = require("../controllers/vehicleController");
const { authMiddleware } = require("../middleware");

/**
 * Rate Limiting específico para consultas veiculares
 * Limita a 10 consultas por minuto por IP para evitar custos desnecessários
 */
const vehicleRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 consultas por minuto por IP
  message: {
    success: false,
    message: "Muitas consultas veiculares. Tente novamente em 1 minuto.",
    errors: {
      rate_limit: "Limite de 10 consultas por minuto excedido",
      retry_after: "60 segundos",
    },
  },
  standardHeaders: true, // Retorna rate limit info nos headers
  legacyHeaders: false, // Desabilita headers X-RateLimit-*
  handler: (req, res) => {
    console.warn(
      `⚠️ Rate Limit: IP ${req.ip} excedeu limite de consultas veiculares`
    );
    res.status(429).json({
      success: false,
      message: "Muitas consultas veiculares. Tente novamente em 1 minuto.",
      errors: {
        rate_limit: "Limite de 10 consultas por minuto excedido",
        retry_after: "60 segundos",
        ip: req.ip,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * Rate Limiting mais restritivo para operações administrativas
 * Limita a 5 operações por minuto por usuário
 */
const adminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // máximo 5 operações por minuto por usuário
  keyGenerator: (req) => {
    // Usar userId como chave para rate limiting por usuário
    return req.user?.userId || req.ip;
  },
  message: {
    success: false,
    message: "Muitas operações administrativas. Tente novamente em 1 minuto.",
    errors: {
      rate_limit: "Limite de 5 operações por minuto excedido",
      retry_after: "60 segundos",
    },
  },
  handler: (req, res) => {
    console.warn(
      `⚠️ Admin Rate Limit: Usuário ${req.user?.userId} excedeu limite de operações administrativas`
    );
    res.status(429).json({
      success: false,
      message: "Muitas operações administrativas. Tente novamente em 1 minuto.",
      errors: {
        rate_limit: "Limite de 5 operações por minuto excedido",
        retry_after: "60 segundos",
        usuario_id: req.user?.userId,
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * Middleware para validar formato de placa na URL
 */
const validarPlacaMiddleware = (req, res, next) => {
  const { placa } = req.params;

  if (!placa) {
    return res.status(400).json({
      success: false,
      message: "Placa é obrigatória",
      errors: {
        placa: "Parâmetro placa é obrigatório na URL",
      },
    });
  }

  // Normalizar placa (remover hífens e converter para maiúscula)
  const placaNormalizada = placa.replace(/-/g, "").toUpperCase();

  // Validar formato da placa (Mercosul ou antigo)
  const placaRegex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/;

  if (!placaRegex.test(placaNormalizada)) {
    return res.status(400).json({
      success: false,
      message: "Formato de placa inválido",
      errors: {
        placa:
          "Placa deve estar no formato Mercosul (ABC1D23) ou antigo (ABC-1234)",
        formato_esperado: ["ABC1D23", "ABC-1234"],
        placa_recebida: placa,
        placa_normalizada: placaNormalizada,
      },
    });
  }

  // Adicionar placa normalizada ao request
  req.params.placa = placaNormalizada;
  next();
};

/**
 * Middleware para log de consultas veiculares
 */
const logConsultaMiddleware = (req, res, next) => {
  const { placa } = req.params;
  const userId = req.user?.userId;
  const userType = req.user?.tipo;

  console.log(`🔍 VehicleRoutes: Consulta veicular iniciada:`);
  console.log(`- Placa: ${placa}`);
  console.log(`- Usuário: ${userId} (${userType})`);
  console.log(`- IP: ${req.ip}`);
  console.log(`- Timestamp: ${new Date().toISOString()}`);

  next();
};

// ==================== ROTAS ====================

/**
 * GET /api/vehicle/consulta/:placa
 * Consulta dados de veículo por placa
 *
 * Middlewares aplicados:
 * 1. authMiddleware - Autenticação JWT
 * 2. vehicleRateLimit - Rate limiting específico
 * 3. validarPlacaMiddleware - Validação de formato
 * 4. logConsultaMiddleware - Log da consulta
 * 5. VehicleController.consultarPlaca - Controller
 */
router.get(
  "/consulta/:placa",
  authMiddleware,
  vehicleRateLimit,
  validarPlacaMiddleware,
  logConsultaMiddleware,
  VehicleController.consultarPlaca
);

/**
 * GET /api/vehicle/stats
 * Obtém estatísticas do cache da API veicular
 * Apenas para administradores e autopeças
 */
router.get(
  "/stats",
  authMiddleware,
  adminRateLimit,
  VehicleController.obterEstatisticas
);

/**
 * DELETE /api/vehicle/cache
 * Limpa o cache da API veicular
 * Apenas para administradores
 * Query params: ?placa=ABC1234 (opcional, para limpar cache específico)
 */
router.delete(
  "/cache",
  authMiddleware,
  adminRateLimit,
  VehicleController.limparCache
);

/**
 * GET /api/vehicle/health
 * Health check da API veicular
 * Verifica se o serviço está funcionando
 */
router.get("/health", (req, res) => {
  try {
    const config =
      require("../services/apiVeicularService").verificarConfiguracao();

    res.status(200).json({
      success: true,
      message: "API veicular funcionando",
      data: {
        status: "healthy",
        configuracao: {
          api_configured: config.api_configured,
          cache_enabled: config.cache_enabled,
          timeout: config.timeout,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ VehicleRoutes: Erro no health check:", error);
    res.status(503).json({
      success: false,
      message: "API veicular com problemas",
      errors: {
        motivo: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/vehicle/circuit-breaker/status
 * Obtém status detalhado do circuit breaker
 */
router.get(
  "/circuit-breaker/status",
  authMiddleware,
  adminRateLimit,
  VehicleController.obterStatusCircuitBreaker
);

/**
 * POST /api/vehicle/circuit-breaker/open
 * Força abertura do circuit breaker (para testes ou emergência)
 */
router.post(
  "/circuit-breaker/open",
  authMiddleware,
  adminRateLimit,
  VehicleController.forcarAberturaCircuitBreaker
);

/**
 * POST /api/vehicle/circuit-breaker/close
 * Força fechamento do circuit breaker (para testes ou recuperação)
 */
router.post(
  "/circuit-breaker/close",
  authMiddleware,
  adminRateLimit,
  VehicleController.forcarFechamentoCircuitBreaker
);

/**
 * DELETE /api/vehicle/circuit-breaker/metrics
 * Reseta métricas do circuit breaker
 */
router.delete(
  "/circuit-breaker/metrics",
  authMiddleware,
  adminRateLimit,
  VehicleController.resetarMetricasCircuitBreaker
);

/**
 * GET /api/vehicle/docs
 * Documentação da API veicular
 */
router.get("/docs", (req, res) => {
  res.json({
    success: true,
    message: "Documentação da API Veicular",
    data: {
      endpoints: {
        "GET /api/vehicle/consulta/:placa": {
          descricao: "Consulta dados de veículo por placa",
          autenticacao: "JWT obrigatório",
          rate_limit: "10 consultas por minuto por IP",
          parametros: {
            placa: "Placa do veículo (formato: ABC1234 ou ABC-1234)",
          },
          exemplo: "/api/vehicle/consulta/ABC1234",
        },
        "GET /api/vehicle/stats": {
          descricao: "Estatísticas do cache da API veicular",
          autenticacao: "JWT obrigatório (admin ou autopeca)",
          rate_limit: "5 operações por minuto por usuário",
        },
        "DELETE /api/vehicle/cache": {
          descricao: "Limpa o cache da API veicular",
          autenticacao: "JWT obrigatório (admin apenas)",
          rate_limit: "5 operações por minuto por usuário",
          query_params: {
            placa: "Opcional - limpa cache específico de uma placa",
          },
        },
        "GET /api/vehicle/health": {
          descricao: "Health check da API veicular",
          autenticacao: "Não requerida",
        },
        "GET /api/vehicle/circuit-breaker/status": {
          descricao: "Status detalhado do circuit breaker",
          autenticacao: "JWT obrigatório (admin ou autopeca)",
          rate_limit: "5 operações por minuto por usuário",
        },
        "POST /api/vehicle/circuit-breaker/open": {
          descricao: "Força abertura do circuit breaker",
          autenticacao: "JWT obrigatório (admin apenas)",
          rate_limit: "5 operações por minuto por usuário",
        },
        "POST /api/vehicle/circuit-breaker/close": {
          descricao: "Força fechamento do circuit breaker",
          autenticacao: "JWT obrigatório (admin apenas)",
          rate_limit: "5 operações por minuto por usuário",
        },
        "DELETE /api/vehicle/circuit-breaker/metrics": {
          descricao: "Reseta métricas do circuit breaker",
          autenticacao: "JWT obrigatório (admin apenas)",
          rate_limit: "5 operações por minuto por usuário",
        },
      },
      formatos_resposta: {
        sucesso: {
          success: true,
          message: "string",
          data: "object",
        },
        erro: {
          success: false,
          message: "string",
          errors: "object",
          debug_info: "object",
        },
      },
      exemplos: {
        consulta_sucesso: {
          success: true,
          message: "Consulta realizada com sucesso",
          data: {
            veiculo: {
              placa: "ABC1234",
              marca: "Volkswagen",
              modelo: "Golf",
              ano_fabricacao: 2020,
              ano_modelo: 2020,
              categoria: "carro",
              cor: "Branco",
              chassi: "9BWZZZZZZZZZZZZZZ",
              renavam: "12345678901",
              origem_dados_veiculo: "api",
            },
            consulta_info: {
              consultado: true,
              origem: "api",
              timestamp: "2024-09-21T01:55:04.933Z",
              usuario_id: "user-123",
              usuario_tipo: "cliente",
            },
          },
        },
      },
    },
  });
});

module.exports = router;
