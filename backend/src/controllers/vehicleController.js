const { apiVeicularService } = require("../services");

/**
 * Controller de Consulta Veicular
 * Gerencia consultas diretas à API veicular
 */
class VehicleController {
  /**
   * Consulta dados de veículo por placa
   * GET /api/vehicle/consulta/:placa
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async consultarPlaca(req, res) {
    try {
      const { placa } = req.params;

      // 1. Validar se a placa foi fornecida
      if (!placa) {
        return res.status(400).json({
          success: false,
          message: "Placa é obrigatória",
          errors: {
            placa: "Parâmetro placa é obrigatório na URL",
          },
        });
      }

      // 2. Log da consulta
      console.log(`🔍 VehicleController: Consulta direta para placa: ${placa}`);
      console.log(`👤 Usuário: ${req.user.userId} (${req.user.tipo})`);

      // Obter IP do cliente para rate limiting
      const clientIp =
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      console.log(`🌐 VehicleController: IP do cliente: ${clientIp}`);

      // 3. Consultar API veicular com rate limiting
      const dadosVeiculo = await apiVeicularService.consultarVeiculoPorPlaca(
        placa,
        clientIp
      );

      // 4. Log do resultado
      console.log(`📊 VehicleController: Resultado da consulta:`);
      console.log(`- Placa: ${dadosVeiculo.placa}`);
      console.log(`- Origem: ${dadosVeiculo.origem_dados_veiculo}`);
      console.log(`- Marca: ${dadosVeiculo.marca}`);
      console.log(`- Modelo: ${dadosVeiculo.modelo}`);

      // 5. Adicionar headers de rate limiting se disponível
      if (
        dadosVeiculo.rate_limit_info &&
        dadosVeiculo.rate_limit_info.headers
      ) {
        Object.keys(dadosVeiculo.rate_limit_info.headers).forEach((key) => {
          res.set(key, dadosVeiculo.rate_limit_info.headers[key]);
        });
      }

      // 6. Retornar resposta padronizada
      return res.status(200).json({
        success: true,
        message: "Consulta realizada com sucesso",
        data: {
          veiculo: {
            placa: dadosVeiculo.placa,
            marca: dadosVeiculo.marca,
            modelo: dadosVeiculo.modelo,
            ano_fabricacao: dadosVeiculo.ano_fabricacao,
            ano_modelo: dadosVeiculo.ano_modelo,
            categoria: dadosVeiculo.categoria,
            cor: dadosVeiculo.cor,
            chassi: dadosVeiculo.chassi,
            renavam: dadosVeiculo.renavam,
            origem_dados_veiculo: dadosVeiculo.origem_dados_veiculo,
          },
          consulta_info: {
            consultado: true,
            origem: dadosVeiculo.origem_dados_veiculo,
            timestamp:
              dadosVeiculo.timestamp_consulta || new Date().toISOString(),
            usuario_id: req.user.userId,
            usuario_tipo: req.user.tipo,
          },
          api_metadata: dadosVeiculo.api_veicular_metadata || null,
          rate_limit_info: dadosVeiculo.rate_limit_info || null,
        },
      });
    } catch (error) {
      // 6. Tratamento de erros específico para consultas diretas
      console.error(
        `❌ VehicleController: Erro na consulta da placa ${req.params.placa}:`,
        error
      );

      // Determinar tipo de erro
      let statusCode = 500;
      let errorMessage = "Erro interno do servidor";
      let errorDetails = {};

      if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
        statusCode = 429;

        // Obter informações de rate limiting do erro
        const rateLimitInfo = error.rateLimitInfo || {};

        // Definir headers de rate limiting
        if (rateLimitInfo.headers) {
          Object.keys(rateLimitInfo.headers).forEach((key) => {
            res.set(key, rateLimitInfo.headers[key]);
          });
        }

        errorMessage =
          rateLimitInfo.message ||
          "Muitas consultas veiculares. Tente novamente em 15 minutos.";
        errorDetails = {
          rate_limit: "Limite de consultas veiculares excedido",
          retry_after: rateLimitInfo.timeLeftMinutes
            ? `${rateLimitInfo.timeLeftMinutes} minutos`
            : "15 minutos",
          ip: clientIp,
          current_count: rateLimitInfo.currentCount || 0,
          max_requests: rateLimitInfo.maxRequests || 100,
          reset_time: rateLimitInfo.resetTime,
          environment: rateLimitInfo.environment || "production",
          timestamp: new Date().toISOString(),
        };
      } else if (error.message.includes("Formato de placa inválido")) {
        statusCode = 400;
        errorMessage = "Formato de placa inválido";
        errorDetails = {
          placa:
            "Placa deve estar no formato Mercosul (ABC1D23) ou antigo (ABC-1234)",
          formato_esperado: ["ABC1D23", "ABC-1234"],
        };
      } else if (error.message.includes("API não configurada")) {
        statusCode = 503;
        errorMessage =
          "Serviço de consulta veicular temporariamente indisponível";
        errorDetails = {
          motivo: "API veicular não configurada",
          solucao: "Entre em contato com o suporte técnico",
        };
      } else if (error.response) {
        // Erro da API externa
        statusCode = 502;
        errorMessage = "Erro na consulta à API veicular";
        errorDetails = {
          api_status: error.response.status,
          api_message:
            error.response.data?.message || "Erro desconhecido da API",
        };
      } else if (error.code === "ECONNABORTED") {
        statusCode = 504;
        errorMessage = "Timeout na consulta à API veicular";
        errorDetails = {
          motivo: "API veicular não respondeu no tempo esperado",
          timeout: "10 segundos",
        };
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        errors: errorDetails,
        debug_info: {
          placa_solicitada: req.params.placa,
          timestamp: new Date().toISOString(),
          usuario_id: req.user?.userId || "não autenticado",
        },
      });
    }
  }

  /**
   * Obtém estatísticas do cache da API veicular
   * GET /api/vehicle/stats
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async obterEstatisticas(req, res) {
    try {
      // Verificar se o usuário é admin ou autopeça
      if (req.user.tipo !== "admin" && req.user.tipo !== "autopeca") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            authorization:
              "Apenas administradores e autopeças podem acessar estatísticas",
          },
        });
      }

      const stats = apiVeicularService.obterEstatisticasCache();
      const config = apiVeicularService.verificarConfiguracao();

      // Obter IP do cliente para estatísticas específicas
      const clientIp =
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      const rateLimitStats =
        apiVeicularService.obterEstatisticasRateLimit(clientIp);

      return res.status(200).json({
        success: true,
        message: "Estatísticas obtidas com sucesso",
        data: {
          cache_stats: stats.cache,
          rate_limiting_stats: stats.rate_limiting,
          circuit_breaker_stats: stats.circuit_breaker,
          client_rate_limit: rateLimitStats,
          configuracao: config,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ VehicleController: Erro ao obter estatísticas:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Limpa o cache da API veicular
   * DELETE /api/vehicle/cache
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async limparCache(req, res) {
    try {
      // Verificar se o usuário é admin
      if (req.user.tipo !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            authorization: "Apenas administradores podem limpar o cache",
          },
        });
      }

      const { placa, ip, rate_limit } = req.query;

      if (placa) {
        // Limpar cache específico de uma placa
        apiVeicularService.limparCachePlaca(placa);
        console.log(`🗑️ VehicleController: Cache limpo para placa: ${placa}`);
      } else if (ip) {
        // Limpar rate limiting para um IP específico
        apiVeicularService.limparRateLimit(ip);
        console.log(`🗑️ VehicleController: Rate limit limpo para IP: ${ip}`);
      } else if (rate_limit === "true") {
        // Limpar todo o rate limiting
        apiVeicularService.limparRateLimitCompleto();
        console.log("🗑️ VehicleController: Rate limiting completo limpo");
      } else {
        // Limpar todo o cache
        apiVeicularService.limparCache();
        console.log("🗑️ VehicleController: Cache completo limpo");
      }

      let message, acao;
      if (placa) {
        message = `Cache limpo para placa ${placa}`;
        acao = "limpeza_cache_especifica";
      } else if (ip) {
        message = `Rate limit limpo para IP ${ip}`;
        acao = "limpeza_rate_limit_especifica";
      } else if (rate_limit === "true") {
        message = "Rate limiting completo limpo";
        acao = "limpeza_rate_limit_completa";
      } else {
        message = "Cache completo limpo";
        acao = "limpeza_cache_completa";
      }

      return res.status(200).json({
        success: true,
        message,
        data: {
          acao,
          placa: placa || null,
          ip: ip || null,
          rate_limit_cleared: rate_limit === "true",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ VehicleController: Erro ao limpar cache:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Obtém status detalhado do circuit breaker
   * GET /api/vehicle/circuit-breaker/status
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async obterStatusCircuitBreaker(req, res) {
    try {
      // Verificar se o usuário é admin ou autopeca
      if (req.user.tipo !== "admin" && req.user.tipo !== "autopeca") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            authorization:
              "Apenas administradores e autopeças podem acessar status do circuit breaker",
          },
        });
      }

      const status = apiVeicularService.obterStatusCircuitBreaker();

      return res.status(200).json({
        success: true,
        message: "Status do circuit breaker obtido com sucesso",
        data: status,
      });
    } catch (error) {
      console.error(
        "❌ VehicleController: Erro ao obter status do circuit breaker:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Força abertura do circuit breaker (para testes ou emergência)
   * POST /api/vehicle/circuit-breaker/open
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async forcarAberturaCircuitBreaker(req, res) {
    try {
      // Verificar se o usuário é admin
      if (req.user.tipo !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            authorization:
              "Apenas administradores podem forçar abertura do circuit breaker",
          },
        });
      }

      apiVeicularService.forcarAberturaCircuitBreaker();

      return res.status(200).json({
        success: true,
        message: "Circuit breaker forçado a abrir",
        data: {
          action: "circuit_breaker_forced_open",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "❌ VehicleController: Erro ao forçar abertura do circuit breaker:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Força fechamento do circuit breaker (para testes ou recuperação)
   * POST /api/vehicle/circuit-breaker/close
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async forcarFechamentoCircuitBreaker(req, res) {
    try {
      // Verificar se o usuário é admin
      if (req.user.tipo !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            authorization:
              "Apenas administradores podem forçar fechamento do circuit breaker",
          },
        });
      }

      apiVeicularService.forcarFechamentoCircuitBreaker();

      return res.status(200).json({
        success: true,
        message: "Circuit breaker forçado a fechar",
        data: {
          action: "circuit_breaker_forced_close",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "❌ VehicleController: Erro ao forçar fechamento do circuit breaker:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }

  /**
   * Reseta métricas do circuit breaker
   * DELETE /api/vehicle/circuit-breaker/metrics
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async resetarMetricasCircuitBreaker(req, res) {
    try {
      // Verificar se o usuário é admin
      if (req.user.tipo !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
          errors: {
            authorization:
              "Apenas administradores podem resetar métricas do circuit breaker",
          },
        });
      }

      apiVeicularService.resetarMetricasCircuitBreaker();

      return res.status(200).json({
        success: true,
        message: "Métricas do circuit breaker resetadas",
        data: {
          action: "circuit_breaker_metrics_reset",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "❌ VehicleController: Erro ao resetar métricas do circuit breaker:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }
}

module.exports = VehicleController;
