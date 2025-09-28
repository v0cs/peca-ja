const { apiVeicularService } = require("../services");

/**
 * Middleware de Consulta Veicular
 * Intercepta requests POST para criação de solicitações e consulta a API veicular
 * se uma placa for fornecida, mesclando os dados automaticamente
 */
const consultaVeicularMiddleware = async (req, res, next) => {
  try {
    // Verificar se é uma requisição POST para criação de solicitação
    if (req.method !== "POST") {
      return next();
    }

    // Verificar se há placa no body da requisição
    const { placa } = req.body;

    if (!placa || typeof placa !== "string" || placa.trim() === "") {
      // Sem placa, continuar com dados manuais
      req.body.origem_dados_veiculo = "manual";
      return next();
    }

    console.log(`🔍 Middleware: Consultando API veicular para placa: ${placa}`);

    try {
      // Obter IP do cliente para rate limiting
      const clientIp =
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      console.log(`🌐 Middleware: IP do cliente: ${clientIp}`);

      // Consultar API veicular com rate limiting
      const dadosVeiculo = await apiVeicularService.consultarVeiculoPorPlaca(
        placa,
        clientIp
      );

      // Verificar se a consulta foi bem-sucedida
      if (dadosVeiculo && dadosVeiculo.origem_dados) {
        // Mesclar dados da API com os dados do request
        req.body = {
          ...req.body,
          // Dados do veículo da API
          placa: dadosVeiculo.placa,
          marca: dadosVeiculo.marca,
          modelo: dadosVeiculo.modelo,
          ano_fabricacao: dadosVeiculo.ano_fabricacao,
          ano_modelo: dadosVeiculo.ano_modelo,
          categoria: dadosVeiculo.categoria,
          cor: dadosVeiculo.cor,
          chassi: dadosVeiculo.chassi,
          renavam: dadosVeiculo.renavam,

          // Metadados da API
          origem_dados_veiculo: dadosVeiculo.origem_dados_veiculo,
          api_veicular_metadata: dadosVeiculo.api_veicular_metadata,
        };

        console.log(
          `✅ Middleware: Dados da API veicular mesclados (origem: ${dadosVeiculo.origem_dados})`
        );

        // Adicionar informações sobre a consulta no request para logging
        req.apiVeicularInfo = {
          consultado: true,
          origem: dadosVeiculo.origem_dados,
          placa: dadosVeiculo.placa,
          timestamp: new Date().toISOString(),
        };
      } else {
        // API retornou dados inválidos, usar dados manuais
        console.log(
          "⚠️ Middleware: API retornou dados inválidos, usando dados manuais"
        );
        req.body.origem_dados_veiculo = "manual";
        req.apiVeicularInfo = {
          consultado: true,
          origem: "manual",
          motivo: "dados_invalidos",
          placa: placa,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      // Verificar se é erro de rate limiting
      if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
        console.warn(
          `🚫 Middleware: Rate limit excedido para IP ${clientIp}: ${error.message}`
        );

        // Obter informações de rate limiting do erro
        const rateLimitInfo = error.rateLimitInfo || {};

        // Definir headers de rate limiting
        const headers = rateLimitInfo.headers || {};
        Object.keys(headers).forEach((key) => {
          res.set(key, headers[key]);
        });

        // Para rate limiting, retornar erro específico
        return res.status(429).json({
          success: false,
          message:
            rateLimitInfo.message ||
            "Muitas consultas veiculares. Tente novamente em 15 minutos.",
          errors: {
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
          },
        });
      }

      // API falhou por outros motivos, continuar silenciosamente com dados manuais
      console.log(
        `⚠️ Middleware: API veicular falhou para placa ${placa}: ${error.message}`
      );

      // Manter dados originais e marcar como manual
      req.body.origem_dados_veiculo = "manual";

      // Adicionar informações sobre o erro para logging
      req.apiVeicularInfo = {
        consultado: true,
        origem: "manual",
        motivo: "api_falhou",
        erro: error.message,
        placa: placa,
        ip: clientIp,
        timestamp: new Date().toISOString(),
      };
    }

    // Continuar para o próximo middleware/controller
    next();
  } catch (error) {
    // Erro crítico no middleware, continuar com dados manuais
    console.error(
      "❌ Middleware: Erro crítico na consulta veicular:",
      error.message
    );

    req.body.origem_dados_veiculo = "manual";
    req.apiVeicularInfo = {
      consultado: false,
      origem: "manual",
      motivo: "erro_critico",
      erro: error.message,
      timestamp: new Date().toISOString(),
    };

    next();
  }
};

/**
 * Middleware específico para rotas de solicitações
 * Aplica a consulta veicular apenas em rotas específicas
 */
const consultaVeicularSolicitacoesMiddleware = async (req, res, next) => {
  // Verificar se é uma rota de solicitação
  const isSolicitacaoRoute =
    req.path.includes("/solicitacoes") ||
    req.path.includes("/requests") ||
    req.baseUrl.includes("/solicitacoes") ||
    req.baseUrl.includes("/requests");

  if (!isSolicitacaoRoute) {
    return next();
  }

  // Aplicar middleware de consulta veicular
  return consultaVeicularMiddleware(req, res, next);
};

/**
 * Middleware para logging de consultas veiculares
 * Registra informações sobre consultas realizadas
 */
const logConsultaVeicularMiddleware = (req, res, next) => {
  // Interceptar resposta para logging
  const originalSend = res.send;

  res.send = function (data) {
    // Log apenas se houve consulta veicular
    if (req.apiVeicularInfo) {
      console.log("📊 Log Consulta Veicular:", {
        placa: req.apiVeicularInfo.placa,
        origem: req.apiVeicularInfo.origem,
        motivo: req.apiVeicularInfo.motivo || "sucesso",
        timestamp: req.apiVeicularInfo.timestamp,
        statusCode: res.statusCode,
        endpoint: `${req.method} ${req.path}`,
      });
    }

    // Chamar método original
    return originalSend.call(this, data);
  };

  next();
};

module.exports = {
  consultaVeicularMiddleware,
  consultaVeicularSolicitacoesMiddleware,
  logConsultaVeicularMiddleware,
};
