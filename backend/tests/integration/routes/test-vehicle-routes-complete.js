const express = require("express");
const jwt = require("jsonwebtoken");
const { apiVeicularService } = require("./src/services");

/**
 * Teste Completo das Rotas de Veículo
 * Demonstra o funcionamento completo da rota GET /api/vehicle/consulta/:placa
 * com todos os middlewares integrados
 */

const app = express();
const PORT = 3009;

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

// Simular autenticação JWT
const generateTestToken = (userId, tipo) => {
  return jwt.sign({ userId, tipo }, "test-secret-key", { expiresIn: "1h" });
};

// Middleware de autenticação simulado
const mockAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token de acesso não fornecido",
      errors: {
        authorization: "Header Authorization com Bearer token é obrigatório",
      },
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, "test-secret-key");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido ou expirado",
      errors: {
        authorization: "Token JWT inválido",
      },
    });
  }
};

// Rate limiting simulado
const mockRateLimit = (req, res, next) => {
  const ip = req.ip;
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

  // Adicionar headers de rate limiting para resposta de sucesso
  if (rateLimitCheck.headers) {
    Object.keys(rateLimitCheck.headers).forEach((key) => {
      res.set(key, rateLimitCheck.headers[key]);
    });
  }

  req.rateLimitInfo = rateLimitCheck;
  next();
};

// Middleware de validação de placa
const mockValidarPlacaMiddleware = (req, res, next) => {
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

  // Normalizar placa
  let placaNormalizada = placa.replace(/\s+/g, "").toUpperCase();
  placaNormalizada = placaNormalizada.replace(/-/g, "");

  // Validar formato
  const regexPlaca = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/;

  if (!regexPlaca.test(placaNormalizada)) {
    return res.status(400).json({
      success: false,
      message: "Formato de placa inválido",
      errors: {
        placa:
          "Placa deve estar no formato Mercosul (ABC1D23) ou antigo (ABC-1234)",
        formato_esperado: ["ABC1D23", "ABC-1234"],
        placa_recebida: placa,
      },
    });
  }

  req.params.placa = placaNormalizada;
  next();
};

// Middleware de log
const mockLogMiddleware = (req, res, next) => {
  const { placa } = req.params;
  const userId = req.user?.userId;
  const userType = req.user?.tipo;

  console.log(`🔍 Teste: Consulta veicular iniciada:`);
  console.log(`- Placa: ${placa}`);
  console.log(`- Usuário: ${userId} (${userType})`);
  console.log(`- IP: ${req.ip}`);
  console.log(`- Timestamp: ${new Date().toISOString()}`);

  next();
};

// Controller simulado
const mockVehicleController = async (req, res) => {
  try {
    const { placa } = req.params;
    const clientIp = req.ip;

    console.log(`🔍 Controller: Consulta direta para placa: ${placa}`);
    console.log(`👤 Usuário: ${req.user.userId} (${req.user.tipo})`);
    console.log(`🌐 Controller: IP do cliente: ${clientIp}`);

    // Simular consulta usando o service
    const dadosVeiculo = await apiVeicularService.consultarVeiculoPorPlaca(
      placa,
      clientIp
    );

    console.log(`✅ Controller: Dados obtidos:`);
    console.log(`- Placa: ${dadosVeiculo.placa}`);
    console.log(`- Origem: ${dadosVeiculo.origem_dados_veiculo}`);
    console.log(`- Marca: ${dadosVeiculo.marca}`);
    console.log(`- Modelo: ${dadosVeiculo.modelo}`);

    // Retornar resposta padronizada igual ao middleware de solicitações
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
    console.error(
      `❌ Controller: Erro na consulta da placa ${req.params.placa}:`,
      error
    );

    let statusCode = 500;
    let errorMessage = "Erro interno do servidor";
    let errorDetails = {};

    if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
      statusCode = 429;

      const rateLimitInfo = error.rateLimitInfo || {};

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
        ip: req.ip,
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
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      errors: errorDetails,
    });
  }
};

// Rota principal de teste
app.get(
  "/api/vehicle/consulta/:placa",
  mockAuthMiddleware,
  mockRateLimit,
  mockValidarPlacaMiddleware,
  mockLogMiddleware,
  mockVehicleController
);

// Rota para gerar token de teste
app.get("/generate-token/:tipo", (req, res) => {
  const { tipo } = req.params;
  const userId = `user-${Date.now()}`;

  const token = generateTestToken(userId, tipo);

  res.json({
    success: true,
    message: "Token gerado com sucesso",
    data: {
      token: token,
      user_id: userId,
      tipo: tipo,
      expires_in: "1 hora",
    },
  });
});

// Rota de teste básica
app.get("/test", (req, res) => {
  res.json({
    message: "Teste completo das rotas de veículo funcionando!",
    endpoints: {
      "GET /api/vehicle/consulta/:placa":
        "Consulta veicular com todos os middlewares",
      "GET /generate-token/:tipo":
        "Gera token JWT para teste (cliente, vendedor, autopeca, admin)",
    },
    middlewares_aplicados: {
      "1. authMiddleware": "Autenticação JWT obrigatória",
      "2. vehicleRateLimit":
        "Rate limiting específico (100/15min prod, 500/15min dev)",
      "3. validarPlacaMiddleware": "Validação de formato de placa",
      "4. logConsultaMiddleware": "Log detalhado da consulta",
      "5. VehicleController.consultarPlaca": "Controller com circuit breaker",
    },
    funcionalidades: {
      "Rate Limiting": "Integrado com apiVeicularService",
      "Circuit Breaker": "Proteção contra falhas da API",
      "Headers HTTP": "X-RateLimit-* em todas as respostas",
      Validação: "Formato de placa Mercosul e antigo",
      Logs: "Rastreamento completo de consultas",
      Autenticação: "JWT obrigatório para todas as consultas",
    },
    exemplos: {
      "Gerar token cliente":
        "curl http://localhost:3009/generate-token/cliente",
      "Gerar token admin": "curl http://localhost:3009/generate-token/admin",
      "Consulta com token":
        "curl -H 'Authorization: Bearer TOKEN' http://localhost:3009/api/vehicle/consulta/ABC1234",
      "Consulta com placa inválida":
        "curl -H 'Authorization: Bearer TOKEN' http://localhost:3009/api/vehicle/consulta/INVALID",
    },
    teste_completo: {
      "1. Gerar token": "curl http://localhost:3009/generate-token/cliente",
      "2. Fazer consulta":
        "curl -H 'Authorization: Bearer TOKEN' http://localhost:3009/api/vehicle/consulta/ABC1234",
      "3. Verificar headers":
        "curl -I -H 'Authorization: Bearer TOKEN' http://localhost:3009/api/vehicle/consulta/ABC1234",
      "4. Testar rate limit": "Fazer várias consultas rapidamente",
      "5. Testar placa inválida":
        "curl -H 'Authorization: Bearer TOKEN' http://localhost:3009/api/vehicle/consulta/INVALID",
    },
  });
});

app.listen(PORT, () => {
  console.log(
    `🚗 Servidor de teste completo das rotas de veículo rodando na porta ${PORT}`
  );
  console.log(
    `📋 Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log("\n🧪 Para testar a rota completa:");
  console.log("1. Gerar token:");
  console.log("   curl http://localhost:3009/generate-token/cliente");
  console.log("\n2. Fazer consulta:");
  console.log(
    "   curl -H 'Authorization: Bearer TOKEN' http://localhost:3009/api/vehicle/consulta/ABC1234"
  );
  console.log("\n3. Verificar headers:");
  console.log(
    "   curl -I -H 'Authorization: Bearer TOKEN' http://localhost:3009/api/vehicle/consulta/ABC1234"
  );
  console.log("\n4. Testar rate limiting:");
  console.log("   Fazer várias consultas rapidamente");
  console.log("\n5. Testar validação:");
  console.log(
    "   curl -H 'Authorization: Bearer TOKEN' http://localhost:3009/api/vehicle/consulta/INVALID"
  );
});
