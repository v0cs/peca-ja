const express = require("express");
const { apiVeicularService } = require("./src/services");

/**
 * Teste do Rate Limiting Melhorado da API Veicular
 * Demonstra o funcionamento do rate limiting com headers e diferentes ambientes
 */

const app = express();
const PORT = 3008;

// Middleware para parsing de JSON
app.use(express.json());

// Simular diferentes IPs para teste
const ips = [
  "192.168.1.100",
  "192.168.1.101",
  "192.168.1.102",
  "10.0.0.50",
  "172.16.0.25",
];

// Middleware para simular IPs diferentes
app.use((req, res, next) => {
  const ipIndex = Math.floor(Math.random() * ips.length);
  req.ip = ips[ipIndex];
  next();
});

// Rota de teste para consulta com rate limiting melhorado
app.get("/test-consulta/:placa", async (req, res) => {
  try {
    const { placa } = req.params;
    const ip = req.ip;

    console.log(`🔍 Teste: Consultando placa ${placa} para IP ${ip}`);

    // Verificar rate limiting antes da consulta
    const rateLimitCheck = apiVeicularService.verificarRateLimit(ip);

    if (!rateLimitCheck.allowed) {
      // Definir headers de rate limiting
      if (rateLimitCheck.headers) {
        Object.keys(rateLimitCheck.headers).forEach((key) => {
          res.set(key, rateLimitCheck.headers[key]);
        });
      }

      return res.status(429).json({
        success: false,
        message: rateLimitCheck.message,
        errors: {
          rate_limit: "Limite de consultas veiculares excedido",
          retry_after: `${rateLimitCheck.timeLeftMinutes} minutos`,
          ip: ip,
          current_count: rateLimitCheck.currentCount,
          max_requests: rateLimitCheck.maxRequests,
          reset_time: rateLimitCheck.resetTime,
          environment: rateLimitCheck.environment,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Simular consulta (sem chamar API real)
    const dadosSimulados = {
      placa: placa,
      marca: "Volkswagen",
      modelo: "Golf",
      ano_fabricacao: 2020,
      ano_modelo: 2020,
      categoria: "carro",
      cor: "Branco",
      origem_dados_veiculo: "api",
      timestamp_consulta: new Date().toISOString(),
    };

    // Definir headers de rate limiting para resposta de sucesso
    if (rateLimitCheck.headers) {
      Object.keys(rateLimitCheck.headers).forEach((key) => {
        res.set(key, rateLimitCheck.headers[key]);
      });
    }

    res.json({
      success: true,
      message: "Consulta simulada realizada com sucesso",
      data: {
        veiculo: dadosSimulados,
        rate_limit_info: {
          current_count: rateLimitCheck.currentCount,
          max_requests: rateLimitCheck.maxRequests,
          remaining_requests: rateLimitCheck.remainingRequests,
          reset_time: rateLimitCheck.resetTime,
          environment: rateLimitCheck.environment,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
    });
  }
});

// Rota para obter estatísticas de rate limiting para um IP específico
app.get("/stats/:ip", (req, res) => {
  try {
    const { ip } = req.params;
    const stats = apiVeicularService.obterEstatisticasRateLimit(ip);

    res.json({
      success: true,
      message: "Estatísticas de rate limiting obtidas",
      data: {
        ip: ip,
        stats: stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
    });
  }
});

// Rota para limpar rate limiting de um IP específico
app.delete("/clear-rate-limit/:ip", (req, res) => {
  try {
    const { ip } = req.params;
    apiVeicularService.limparRateLimit(ip);

    res.json({
      success: true,
      message: `Rate limiting limpo para IP ${ip}`,
      data: {
        ip: ip,
        action: "rate_limit_cleared",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao limpar rate limiting:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
    });
  }
});

// Rota para obter estatísticas gerais
app.get("/general-stats", (req, res) => {
  try {
    const stats = apiVeicularService.obterEstatisticasCache();

    res.json({
      success: true,
      message: "Estatísticas gerais obtidas",
      data: {
        cache_stats: stats.cache,
        rate_limiting_stats: stats.rate_limiting,
        circuit_breaker_stats: stats.circuit_breaker,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas gerais:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
    });
  }
});

// Rota para testar diferentes ambientes
app.get("/test-environment", (req, res) => {
  try {
    const config = apiVeicularService.verificarConfiguracao();
    const rateLimitConfig = apiVeicularService.getRateLimitConfig();

    res.json({
      success: true,
      message: "Configuração de ambiente obtida",
      data: {
        environment: process.env.NODE_ENV || "development",
        rate_limit_config: rateLimitConfig,
        circuit_breaker_config: config.circuit_breaker_config,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao obter configuração:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
    });
  }
});

// Rota de teste básica
app.get("/test", (req, res) => {
  res.json({
    message: "Teste do rate limiting melhorado da API veicular funcionando!",
    endpoints: {
      "GET /test-consulta/:placa": "Testa consulta com rate limiting e headers",
      "GET /stats/:ip": "Estatísticas de rate limiting para IP específico",
      "DELETE /clear-rate-limit/:ip": "Limpa rate limiting para IP específico",
      "GET /general-stats": "Estatísticas gerais do sistema",
      "GET /test-environment": "Configuração de ambiente atual",
    },
    funcionalidades: {
      "Rate Limiting":
        "100 consultas por 15 minutos (produção) / 500 (desenvolvimento)",
      "Headers HTTP":
        "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
      "Controle por IP": "Cada IP tem seu próprio contador",
      "Cache de Rate Limiting": "TTL de 15 minutos",
      "Ambiente Dinâmico": "Limites diferentes para dev/prod",
      "Mensagens Claras": "Erros detalhados com informações de reset",
      "Integração Circuit Breaker": "Funciona junto com circuit breaker",
    },
    ips_simulados: ips,
    exemplos: {
      "Consulta normal": "curl http://localhost:3008/test-consulta/ABC1234",
      "Estatísticas de IP": "/stats/192.168.1.100",
      "Limpar rate limiting": "DELETE /clear-rate-limit/192.168.1.100",
      "Estatísticas gerais": "/general-stats",
      "Configuração ambiente": "/test-environment",
    },
    teste_rapido: {
      "Fazer muitas consultas":
        "curl http://localhost:3008/test-consulta/ABC1234 (várias vezes)",
      "Verificar limite": "curl http://localhost:3008/stats/192.168.1.100",
      "Limpar limite":
        "curl -X DELETE http://localhost:3008/clear-rate-limit/192.168.1.100",
      "Ver headers": "curl -I http://localhost:3008/test-consulta/ABC1234",
    },
    headers_exemplo: {
      "X-RateLimit-Limit": "100 (produção) ou 500 (desenvolvimento)",
      "X-RateLimit-Remaining": "Consultas restantes na janela atual",
      "X-RateLimit-Reset": "Timestamp Unix do próximo reset",
      "X-RateLimit-Retry-After":
        "Segundos até poder tentar novamente (quando excedido)",
    },
  });
});

app.listen(PORT, () => {
  console.log(
    `🚫 Servidor de teste de rate limiting melhorado rodando na porta ${PORT}`
  );
  console.log(
    `📋 Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log("\n🧪 Para testar o rate limiting melhorado:");
  console.log("1. Fazer várias consultas rapidamente:");
  console.log("   curl http://localhost:3008/test-consulta/ABC1234");
  console.log("   curl http://localhost:3008/test-consulta/ABC1234");
  console.log("   curl http://localhost:3008/test-consulta/ABC1234");
  console.log("\n2. Verificar headers de rate limiting:");
  console.log("   curl -I http://localhost:3008/test-consulta/ABC1234");
  console.log("\n3. Verificar estatísticas:");
  console.log("   curl http://localhost:3008/stats/192.168.1.100");
  console.log("\n4. Limpar rate limiting:");
  console.log(
    "   curl -X DELETE http://localhost:3008/clear-rate-limit/192.168.1.100"
  );
  console.log("\n5. Estatísticas gerais:");
  console.log("   curl http://localhost:3008/general-stats");
  console.log("\n6. Configuração de ambiente:");
  console.log("   curl http://localhost:3008/test-environment");
  console.log("\n📊 Headers de Rate Limiting:");
  console.log("   X-RateLimit-Limit: Limite máximo de consultas");
  console.log("   X-RateLimit-Remaining: Consultas restantes");
  console.log("   X-RateLimit-Reset: Timestamp do próximo reset");
  console.log(
    "   X-RateLimit-Retry-After: Segundos para retry (quando excedido)"
  );
});
