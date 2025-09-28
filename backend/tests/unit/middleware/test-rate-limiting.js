const express = require("express");
const { apiVeicularService } = require("./src/services");

/**
 * Teste do Rate Limiting da API Veicular
 * Demonstra o funcionamento do rate limiting implementado no service
 */

const app = express();
const PORT = 3006;

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

let currentIpIndex = 0;

// Middleware para simular diferentes IPs
app.use((req, res, next) => {
  req.ip = ips[currentIpIndex % ips.length];
  currentIpIndex++;
  next();
});

// Rota de teste para consulta com rate limiting
app.get("/test-consulta/:placa", async (req, res) => {
  try {
    const { placa } = req.params;
    const ip = req.ip;

    console.log(`🔍 Teste: Consultando placa ${placa} para IP ${ip}`);

    // Verificar rate limiting antes da consulta
    const rateLimitCheck = apiVeicularService.verificarRateLimit(ip);

    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: "Rate limit excedido",
        data: {
          rate_limit_info: rateLimitCheck,
          ip,
          placa,
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

    res.json({
      success: true,
      message: "Consulta simulada realizada com sucesso",
      data: {
        veiculo: dadosSimulados,
        rate_limit_info: rateLimitCheck,
        ip,
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

// Rota para verificar estatísticas de rate limiting
app.get("/stats/:ip", (req, res) => {
  try {
    const { ip } = req.params;
    const stats = apiVeicularService.obterEstatisticasRateLimit(ip);

    res.json({
      success: true,
      message: "Estatísticas de rate limiting obtidas",
      data: {
        rate_limit_stats: stats,
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

// Rota para limpar rate limiting de um IP
app.delete("/clear-rate-limit/:ip", (req, res) => {
  try {
    const { ip } = req.params;
    apiVeicularService.limparRateLimit(ip);

    res.json({
      success: true,
      message: `Rate limiting limpo para IP ${ip}`,
      data: {
        ip,
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
    const config = apiVeicularService.verificarConfiguracao();

    res.json({
      success: true,
      message: "Estatísticas gerais obtidas",
      data: {
        cache_stats: stats.cache,
        rate_limiting_stats: stats.rate_limiting,
        configuracao: config,
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
    message: "Teste de rate limiting da API veicular funcionando!",
    endpoints: {
      "GET /test-consulta/:placa": "Testa consulta com rate limiting",
      "GET /stats/:ip": "Estatísticas de rate limiting para IP específico",
      "DELETE /clear-rate-limit/:ip": "Limpa rate limiting para IP específico",
      "GET /general-stats": "Estatísticas gerais do sistema",
    },
    funcionalidades: {
      "Rate Limiting":
        "100 consultas por 15 minutos (produção) / 200 (desenvolvimento)",
      "Controle por IP": "Cada IP tem seu próprio contador",
      "Cache de Rate Limiting": "TTL de 15 minutos",
      "Ambiente Dinâmico": "Limites diferentes para dev/prod",
      "Estatísticas Detalhadas": "Métricas de uso por IP",
    },
    ips_simulados: ips,
    exemplos: {
      "Consulta com rate limiting": "/test-consulta/ABC1234",
      "Estatísticas de IP": "/stats/192.168.1.100",
      "Limpar rate limiting": "DELETE /clear-rate-limit/192.168.1.100",
      "Estatísticas gerais": "/general-stats",
    },
    teste_rapido: {
      "Fazer muitas consultas":
        "curl http://localhost:3006/test-consulta/ABC1234 (várias vezes)",
      "Verificar limite": "curl http://localhost:3006/stats/192.168.1.100",
      "Limpar limite":
        "curl -X DELETE http://localhost:3006/clear-rate-limit/192.168.1.100",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚫 Servidor de teste de rate limiting rodando na porta ${PORT}`);
  console.log(
    `📋 Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log("\n🧪 Para testar o rate limiting:");
  console.log("1. Faça várias consultas rapidamente:");
  console.log("   curl http://localhost:3006/test-consulta/ABC1234");
  console.log("   curl http://localhost:3006/test-consulta/DEF5678");
  console.log("   curl http://localhost:3006/test-consulta/GHI9012");
  console.log("\n2. Verifique estatísticas:");
  console.log("   curl http://localhost:3006/stats/192.168.1.100");
  console.log("\n3. Limpe rate limiting:");
  console.log(
    "   curl -X DELETE http://localhost:3006/clear-rate-limit/192.168.1.100"
  );
  console.log("\n4. Estatísticas gerais:");
  console.log("   curl http://localhost:3006/general-stats");
});
