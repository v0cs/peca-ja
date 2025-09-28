const express = require("express");
const {
  authMiddleware,
  consultaVeicularSolicitacoesMiddleware,
  logConsultaVeicularMiddleware,
} = require("./src/middleware");
const { uploadMiddleware } = require("./src/middleware/uploadMiddleware");

/**
 * Teste da Ordem dos Middlewares
 * Demonstra a ordem correta: auth → upload → consultaVeicular → controller
 */

const app = express();
const PORT = 3003;

// Middleware para parsing de JSON
app.use(express.json());

// Middleware de autenticação simulado (para teste)
const authMiddlewareSimulado = (req, res, next) => {
  console.log("🔐 1. Auth Middleware: Verificando autenticação...");

  // Simular usuário autenticado
  req.user = {
    id: "user-123",
    tipo: "cliente",
    cliente_id: "cliente-456",
  };

  console.log("✅ Auth Middleware: Usuário autenticado");
  next();
};

// Middleware de upload simulado
const uploadMiddlewareSimulado = (req, res, next) => {
  console.log("📁 2. Upload Middleware: Processando upload de imagens...");

  // Simular upload de imagens
  req.uploadedFiles = [
    { filename: "imagem1.jpg", size: 1024000 },
    { filename: "imagem2.png", size: 2048000 },
  ];

  console.log("✅ Upload Middleware: Imagens processadas");
  next();
};

// Middleware de consulta veicular simulado
const consultaVeicularSimulado = (req, res, next) => {
  console.log(
    "🚗 3. Consulta Veicular Middleware: Consultando API veicular..."
  );

  // Simular consulta da API
  if (req.body.placa) {
    req.body.marca = "Volkswagen";
    req.body.modelo = "Golf";
    req.body.ano_fabricacao = 2020;
    req.body.origem_dados_veiculo = "api";

    console.log("✅ Consulta Veicular Middleware: Dados obtidos da API");
  } else {
    req.body.origem_dados_veiculo = "manual";
    console.log(
      "⚠️ Consulta Veicular Middleware: Sem placa, usando dados manuais"
    );
  }

  next();
};

// Middleware de logging simulado
const logSimulado = (req, res, next) => {
  console.log("📊 4. Log Middleware: Registrando informações...");

  req.logInfo = {
    timestamp: new Date().toISOString(),
    user: req.user.id,
    endpoint: req.path,
    method: req.method,
  };

  console.log("✅ Log Middleware: Informações registradas");
  next();
};

// Rota de teste com ordem correta dos middlewares
app.post(
  "/api/solicitacoes",
  authMiddlewareSimulado, // 1. Auth
  uploadMiddlewareSimulado, // 2. Upload
  consultaVeicularSimulado, // 3. Consulta Veicular
  logSimulado, // 4. Log
  (req, res) => {
    // 5. Controller
    console.log("🎯 5. Controller: Processando solicitação...");

    res.json({
      success: true,
      message: "Solicitação processada com sucesso",
      data: {
        ordem_middlewares: [
          "1. Auth Middleware",
          "2. Upload Middleware",
          "3. Consulta Veicular Middleware",
          "4. Log Middleware",
          "5. Controller",
        ],
        dados_processados: {
          usuario: req.user,
          imagens: req.uploadedFiles,
          veiculo: {
            placa: req.body.placa,
            marca: req.body.marca,
            modelo: req.body.modelo,
            origem: req.body.origem_dados_veiculo,
          },
          log: req.logInfo,
        },
      },
    });
  }
);

// Rota de teste para demonstrar ordem incorreta
app.post(
  "/api/solicitacoes-ordem-incorreta",
  consultaVeicularSimulado, // 1. Consulta Veicular (ANTES do upload)
  authMiddlewareSimulado, // 2. Auth
  uploadMiddlewareSimulado, // 3. Upload
  logSimulado, // 4. Log
  (req, res) => {
    // 5. Controller
    console.log("⚠️ Controller: Ordem incorreta dos middlewares!");

    res.json({
      success: false,
      message: "Ordem incorreta dos middlewares",
      problema: "Consulta Veicular executada antes do Upload",
      ordem_atual: [
        "1. Consulta Veicular Middleware",
        "2. Auth Middleware",
        "3. Upload Middleware",
        "4. Log Middleware",
        "5. Controller",
      ],
      ordem_correta: [
        "1. Auth Middleware",
        "2. Upload Middleware",
        "3. Consulta Veicular Middleware",
        "4. Log Middleware",
        "5. Controller",
      ],
    });
  }
);

// Rota de teste básica
app.get("/test", (req, res) => {
  res.json({
    message: "Teste da ordem dos middlewares funcionando!",
    endpoints: {
      "POST /api/solicitacoes": "Ordem correta dos middlewares",
      "POST /api/solicitacoes-ordem-incorreta":
        "Ordem incorreta (para comparação)",
    },
    ordem_correta: [
      "1. Auth Middleware - Verifica autenticação",
      "2. Upload Middleware - Processa imagens",
      "3. Consulta Veicular Middleware - Consulta API veicular",
      "4. Log Middleware - Registra informações",
      "5. Controller - Processa solicitação",
    ],
    exemplos: {
      "Com placa": {
        placa: "ABC1234",
        descricao_peca: "Peça de teste",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      },
      "Sem placa": {
        descricao_peca: "Peça de teste",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(
    `🧪 Servidor de teste da ordem dos middlewares rodando na porta ${PORT}`
  );
  console.log(
    `📋 Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log("\n🔍 Para testar a ordem correta:");
  console.log(
    'curl -X POST -H "Content-Type: application/json" -d \'{"placa":"ABC1234","descricao_peca":"Teste"}\' http://localhost:3003/api/solicitacoes'
  );
  console.log("\n⚠️ Para testar a ordem incorreta:");
  console.log(
    'curl -X POST -H "Content-Type: application/json" -d \'{"placa":"ABC1234","descricao_peca":"Teste"}\' http://localhost:3003/api/solicitacoes-ordem-incorreta'
  );
});
