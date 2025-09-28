const express = require("express");
const { authMiddleware } = require("./src/middleware");
const VehicleController = require("./src/controllers/vehicleController");

/**
 * Teste das Rotas de Consulta Veicular
 * Demonstra o funcionamento das novas rotas da API veicular
 */

const app = express();
const PORT = 3005;

// Middleware para parsing de JSON
app.use(express.json());

// Middleware de autenticação simulado
const authMiddlewareSimulado = (req, res, next) => {
  console.log("🔐 Auth Middleware: Verificando autenticação...");

  // Simular usuário autenticado
  req.user = {
    userId: "user-123",
    tipo: "cliente",
    cliente_id: "cliente-456",
  };

  console.log("✅ Auth Middleware: Usuário autenticado");
  next();
};

// Middleware de rate limiting simulado
const rateLimitSimulado = (req, res, next) => {
  console.log("⏱️ Rate Limit: Verificando limite de consultas...");
  console.log("✅ Rate Limit: Consulta permitida");
  next();
};

// Middleware de validação de placa simulado
const validarPlacaSimulado = (req, res, next) => {
  const { placa } = req.params;
  console.log(`🔍 Validação: Validando placa ${placa}...`);

  if (!placa) {
    return res.status(400).json({
      success: false,
      message: "Placa é obrigatória",
      errors: { placa: "Parâmetro placa é obrigatório na URL" },
    });
  }

  // Simular normalização
  const placaNormalizada = placa.replace(/-/g, "").toUpperCase();
  req.params.placa = placaNormalizada;

  console.log(`✅ Validação: Placa ${placaNormalizada} validada`);
  next();
};

// Middleware de log simulado
const logSimulado = (req, res, next) => {
  console.log(`📊 Log: Consulta veicular iniciada:`);
  console.log(`- Placa: ${req.params.placa}`);
  console.log(`- Usuário: ${req.user.userId} (${req.user.tipo})`);
  console.log(`- IP: ${req.ip || "127.0.0.1"}`);
  next();
};

// Controller simulado
const controllerSimulado = (req, res) => {
  console.log("\n🎯 VehicleController: Processando consulta...");

  const { placa } = req.params;

  // Simular dados da API veicular
  const dadosVeiculo = {
    placa: placa,
    marca: "Volkswagen",
    modelo: "Golf",
    ano_fabricacao: 2020,
    ano_modelo: 2020,
    categoria: "carro",
    cor: "Branco",
    chassi: "9BWZZZZZZZZZZZZZZ",
    renavam: "12345678901",
    origem_dados_veiculo: "api",
    timestamp_consulta: new Date().toISOString(),
    api_veicular_metadata: {
      consultado: true,
      origem: "api",
      timestamp: new Date().toISOString(),
    },
  };

  console.log("✅ VehicleController: Consulta realizada com sucesso");

  res.status(200).json({
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
        timestamp: dadosVeiculo.timestamp_consulta,
        usuario_id: req.user.userId,
        usuario_tipo: req.user.tipo,
      },
      api_metadata: dadosVeiculo.api_veicular_metadata,
    },
  });
};

// Rota de teste com ordem correta dos middlewares
app.get(
  "/api/vehicle/consulta/:placa",
  authMiddlewareSimulado, // 1. Auth
  rateLimitSimulado, // 2. Rate Limit
  validarPlacaSimulado, // 3. Validação
  logSimulado, // 4. Log
  controllerSimulado // 5. Controller
);

// Rota de teste para estatísticas
app.get("/api/vehicle/stats", authMiddlewareSimulado, (req, res) => {
  console.log("📊 VehicleController: Obtendo estatísticas...");

  res.json({
    success: true,
    message: "Estatísticas obtidas com sucesso",
    data: {
      cache_stats: {
        keys: 15,
        hits: 120,
        misses: 8,
        ttl: 86400,
      },
      configuracao: {
        api_configured: true,
        cache_enabled: true,
        timeout: 10000,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// Rota de teste para health check
app.get("/api/vehicle/health", (req, res) => {
  console.log("🏥 Health Check: Verificando status da API veicular...");

  res.json({
    success: true,
    message: "API veicular funcionando",
    data: {
      status: "healthy",
      configuracao: {
        api_configured: true,
        cache_enabled: true,
        timeout: 10000,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// Rota de teste para documentação
app.get("/api/vehicle/docs", (req, res) => {
  res.json({
    success: true,
    message: "Documentação da API Veicular",
    data: {
      endpoints: {
        "GET /api/vehicle/consulta/:placa":
          "Consulta dados de veículo por placa",
        "GET /api/vehicle/stats": "Estatísticas do cache da API veicular",
        "GET /api/vehicle/health": "Health check da API veicular",
        "GET /api/vehicle/docs": "Documentação da API veicular",
      },
      exemplos: {
        "Consulta com placa": "/api/vehicle/consulta/ABC1234",
        "Consulta com hífen": "/api/vehicle/consulta/ABC-1234",
      },
    },
  });
});

// Rota de teste básica
app.get("/test", (req, res) => {
  res.json({
    message: "Teste das rotas de consulta veicular funcionando!",
    endpoints: {
      "GET /api/vehicle/consulta/:placa": "Consulta dados de veículo por placa",
      "GET /api/vehicle/stats": "Estatísticas do cache",
      "GET /api/vehicle/health": "Health check",
      "GET /api/vehicle/docs": "Documentação",
    },
    funcionalidades: {
      "Autenticação JWT": "Todas as rotas protegidas",
      "Rate Limiting": "10 consultas por minuto por IP",
      "Validação de Placa": "Formato Mercosul e antigo",
      "Logs Detalhados": "Rastreamento de consultas",
      "Tratamento de Erros": "Respostas padronizadas",
    },
    exemplos: {
      "Placa Mercosul": "/api/vehicle/consulta/ABC1D23",
      "Placa Antiga": "/api/vehicle/consulta/ABC-1234",
      "Placa com Hífen": "/api/vehicle/consulta/ABC-1234",
    },
  });
});

app.listen(PORT, () => {
  console.log(
    `🚗 Servidor de teste das rotas veiculares rodando na porta ${PORT}`
  );
  console.log(
    `📋 Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log("\n🧪 Para testar as rotas veiculares:");
  console.log(
    'curl -H "Authorization: Bearer seu-jwt-token" http://localhost:3005/api/vehicle/consulta/ABC1234'
  );
  console.log(
    'curl -H "Authorization: Bearer seu-jwt-token" http://localhost:3005/api/vehicle/consulta/ABC-1234'
  );
  console.log(
    'curl -H "Authorization: Bearer seu-jwt-token" http://localhost:3005/api/vehicle/stats'
  );
  console.log("curl http://localhost:3005/api/vehicle/health");
  console.log("curl http://localhost:3005/api/vehicle/docs");
});
