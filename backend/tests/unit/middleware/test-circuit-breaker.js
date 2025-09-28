const express = require("express");
const { apiVeicularService } = require("./src/services");

/**
 * Teste do Circuit Breaker da API Veicular
 * Demonstra o funcionamento do circuit breaker implementado no service
 */

const app = express();
const PORT = 3007;

// Middleware para parsing de JSON
app.use(express.json());

// Simular diferentes cenários de falha
let failureCount = 0;
let shouldFail = false;

// Middleware para simular falhas da API
app.use((req, res, next) => {
  req.ip = "192.168.1.100";
  next();
});

// Rota de teste para consulta com circuit breaker
app.get("/test-consulta/:placa", async (req, res) => {
  try {
    const { placa } = req.params;
    const ip = req.ip;

    console.log(`🔍 Teste: Consultando placa ${placa} para IP ${ip}`);
    console.log(
      `🔌 Circuit Breaker: Estado atual - ${apiVeicularService.circuitBreaker.state}`
    );

    // Simular falhas para testar circuit breaker
    if (shouldFail && failureCount < 10) {
      failureCount++;
      console.log(`❌ Simulando falha ${failureCount}/10`);
      throw new Error("Simulação de falha da API");
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

    res.json({
      success: true,
      message: "Consulta simulada realizada com sucesso",
      data: {
        veiculo: dadosSimulados,
        circuit_breaker_state: apiVeicularService.circuitBreaker.state,
        failure_count: failureCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
      circuit_breaker_state: apiVeicularService.circuitBreaker.state,
    });
  }
});

// Rota para simular falhas da API
app.post("/simulate-failures", (req, res) => {
  shouldFail = true;
  failureCount = 0;

  res.json({
    success: true,
    message: "Simulação de falhas ativada",
    data: {
      action: "failures_simulation_enabled",
      failure_count: failureCount,
      circuit_breaker_state: apiVeicularService.circuitBreaker.state,
      timestamp: new Date().toISOString(),
    },
  });
});

// Rota para parar simulação de falhas
app.post("/stop-failures", (req, res) => {
  shouldFail = false;
  failureCount = 0;

  res.json({
    success: true,
    message: "Simulação de falhas desativada",
    data: {
      action: "failures_simulation_disabled",
      failure_count: failureCount,
      circuit_breaker_state: apiVeicularService.circuitBreaker.state,
      timestamp: new Date().toISOString(),
    },
  });
});

// Rota para obter status do circuit breaker
app.get("/circuit-breaker-status", (req, res) => {
  try {
    const status = apiVeicularService.obterStatusCircuitBreaker();

    res.json({
      success: true,
      message: "Status do circuit breaker obtido",
      data: status,
    });
  } catch (error) {
    console.error("❌ Erro ao obter status:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
    });
  }
});

// Rota para forçar abertura do circuit breaker
app.post("/force-open", (req, res) => {
  try {
    apiVeicularService.forcarAberturaCircuitBreaker();

    res.json({
      success: true,
      message: "Circuit breaker forçado a abrir",
      data: {
        action: "circuit_breaker_forced_open",
        state: apiVeicularService.circuitBreaker.state,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao forçar abertura:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
    });
  }
});

// Rota para forçar fechamento do circuit breaker
app.post("/force-close", (req, res) => {
  try {
    apiVeicularService.forcarFechamentoCircuitBreaker();

    res.json({
      success: true,
      message: "Circuit breaker forçado a fechar",
      data: {
        action: "circuit_breaker_forced_close",
        state: apiVeicularService.circuitBreaker.state,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao forçar fechamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message,
    });
  }
});

// Rota para resetar métricas
app.delete("/reset-metrics", (req, res) => {
  try {
    apiVeicularService.resetarMetricasCircuitBreaker();

    res.json({
      success: true,
      message: "Métricas do circuit breaker resetadas",
      data: {
        action: "circuit_breaker_metrics_reset",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao resetar métricas:", error);
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

// Rota de teste básica
app.get("/test", (req, res) => {
  res.json({
    message: "Teste do circuit breaker da API veicular funcionando!",
    endpoints: {
      "GET /test-consulta/:placa": "Testa consulta com circuit breaker",
      "POST /simulate-failures": "Ativa simulação de falhas",
      "POST /stop-failures": "Desativa simulação de falhas",
      "GET /circuit-breaker-status": "Status detalhado do circuit breaker",
      "POST /force-open": "Força abertura do circuit breaker",
      "POST /force-close": "Força fechamento do circuit breaker",
      "DELETE /reset-metrics": "Reseta métricas do circuit breaker",
      "GET /general-stats": "Estatísticas gerais do sistema",
    },
    funcionalidades: {
      "Circuit Breaker": "Proteção contra falhas da API veicular",
      Estados: "CLOSED (normal), OPEN (falhas), HALF-OPEN (testando)",
      Configuração: "Timeout 10s, 50% falhas, Reset 30s",
      "Fallback Automático": "Dados padrão quando API falha",
      "Métricas Detalhadas": "Monitoramento de sucessos/falhas",
      "Controle Manual": "Forçar abertura/fechamento para testes",
    },
    teste_circuit_breaker: {
      "1. Estado Normal": "curl http://localhost:3007/test-consulta/ABC1234",
      "2. Simular Falhas":
        "curl -X POST http://localhost:3007/simulate-failures",
      "3. Fazer Consultas":
        "curl http://localhost:3007/test-consulta/ABC1234 (várias vezes)",
      "4. Verificar Estado":
        "curl http://localhost:3007/circuit-breaker-status",
      "5. Forçar Abertura": "curl -X POST http://localhost:3007/force-open",
      "6. Testar Fallback": "curl http://localhost:3007/test-consulta/ABC1234",
      "7. Forçar Fechamento": "curl -X POST http://localhost:3007/force-close",
      "8. Parar Simulação": "curl -X POST http://localhost:3007/stop-failures",
    },
    configuracoes: {
      Timeout: "10 segundos",
      "Error Threshold": "50% de falhas",
      "Reset Timeout": "30 segundos",
      "Volume Threshold": "5 requests mínimos",
      "Rolling Window": "10 segundos",
    },
  });
});

app.listen(PORT, () => {
  console.log(
    `🔌 Servidor de teste do circuit breaker rodando na porta ${PORT}`
  );
  console.log(
    `📋 Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log("\n🧪 Para testar o circuit breaker:");
  console.log("1. Estado normal:");
  console.log("   curl http://localhost:3007/test-consulta/ABC1234");
  console.log("\n2. Simular falhas:");
  console.log("   curl -X POST http://localhost:3007/simulate-failures");
  console.log(
    "   curl http://localhost:3007/test-consulta/ABC1234 (várias vezes)"
  );
  console.log("\n3. Verificar estado:");
  console.log("   curl http://localhost:3007/circuit-breaker-status");
  console.log("\n4. Forçar abertura:");
  console.log("   curl -X POST http://localhost:3007/force-open");
  console.log("\n5. Testar fallback:");
  console.log("   curl http://localhost:3007/test-consulta/ABC1234");
  console.log("\n6. Forçar fechamento:");
  console.log("   curl -X POST http://localhost:3007/force-close");
  console.log("\n7. Parar simulação:");
  console.log("   curl -X POST http://localhost:3007/stop-failures");
});
