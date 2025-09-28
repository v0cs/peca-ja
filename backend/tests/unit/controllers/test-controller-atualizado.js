const express = require("express");
const {
  authMiddleware,
  consultaVeicularSolicitacoesMiddleware,
  logConsultaVeicularMiddleware,
} = require("./src/middleware");
const { uploadMiddleware } = require("./src/middleware/uploadMiddleware");

/**
 * Teste do Controller Atualizado
 * Demonstra como o controller funciona com os dados processados pelo middleware
 */

const app = express();
const PORT = 3004;

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

// Middleware de upload simulado
const uploadMiddlewareSimulado = (req, res, next) => {
  console.log("📁 Upload Middleware: Processando upload de imagens...");

  // Simular upload de imagens
  req.uploadedFiles = [
    {
      filename: "1758415878572_6690.png",
      originalname: "imagem1.png",
      size: 1024000,
      mimetype: "image/png",
      path: "./uploads/1758415878572_6690.png",
    },
    {
      filename: "1758414979565_8579.png",
      originalname: "imagem2.png",
      size: 2048000,
      mimetype: "image/png",
      path: "./uploads/1758414979565_8579.png",
    },
  ];

  // Simular req.files para compatibilidade
  req.files = req.uploadedFiles;

  console.log("✅ Upload Middleware: Imagens processadas");
  next();
};

// Controller simulado que demonstra o comportamento atualizado
const controllerSimulado = (req, res) => {
  console.log("\n🎯 Controller: Processando solicitação...");

  // Simular logs do controller atualizado
  console.log("📋 Controller: Dados recebidos (processados pelo middleware):");
  console.log("- Placa:", req.body.placa);
  console.log("- Marca:", req.body.marca);
  console.log("- Modelo:", req.body.modelo);
  console.log("- Origem dos dados:", req.body.origem_dados_veiculo);
  console.log("- Info da API:", req.apiVeicularInfo);

  console.log("💾 Controller: Criando solicitação com dados processados:");
  console.log("- Origem dos dados:", req.body.origem_dados_veiculo);
  console.log("- Dados da API disponíveis:", !!req.body.api_veicular_metadata);

  // Simular criação da solicitação
  const solicitacaoSimulada = {
    id: "solicitacao-789",
    placa: req.body.placa,
    marca: req.body.marca,
    modelo: req.body.modelo,
    ano_fabricacao: req.body.ano_fabricacao,
    ano_modelo: req.body.ano_modelo,
    categoria: req.body.categoria,
    cor: req.body.cor,
    origem_dados_veiculo: req.body.origem_dados_veiculo,
    status_cliente: "ativa",
    cidade_atendimento: req.body.cidade_atendimento,
    uf_atendimento: req.body.uf_atendimento,
    created_at: new Date().toISOString(),
  };

  console.log("✅ Controller: Solicitação criada com sucesso:");
  console.log("- ID:", solicitacaoSimulada.id);
  console.log("- Placa:", solicitacaoSimulada.placa);
  console.log("- Origem dos dados:", solicitacaoSimulada.origem_dados_veiculo);
  console.log("- Imagens:", req.uploadedFiles?.length || 0);

  res.status(201).json({
    success: true,
    message: `Solicitação criada com ${
      req.uploadedFiles?.length || 0
    } imagem(ns)`,
    data: {
      solicitacao: solicitacaoSimulada,
      imagens: (req.uploadedFiles || []).map((img, index) => ({
        id: `imagem-${index + 1}`,
        nome_arquivo: img.originalname,
        url: `/uploads/${img.filename}`,
      })),
      api_veicular_info: {
        consultado: req.apiVeicularInfo?.consultado || false,
        origem: req.apiVeicularInfo?.origem || "manual",
        motivo: req.apiVeicularInfo?.motivo || "nao_consultado",
        timestamp: req.apiVeicularInfo?.timestamp || new Date().toISOString(),
      },
    },
  });
};

// Rota de teste com ordem correta dos middlewares
app.post(
  "/api/solicitacoes",
  authMiddlewareSimulado, // 1. Auth
  uploadMiddlewareSimulado, // 2. Upload
  consultaVeicularSolicitacoesMiddleware, // 3. Consulta Veicular
  logConsultaVeicularMiddleware, // 4. Log
  controllerSimulado // 5. Controller
);

// Rota de teste básica
app.get("/test", (req, res) => {
  res.json({
    message: "Teste do controller atualizado funcionando!",
    endpoints: {
      "POST /api/solicitacoes":
        "Criação de solicitação com controller atualizado",
    },
    funcionalidades: {
      "Logs de tracking": "Controller registra origem dos dados",
      "Dados mesclados": "Usa dados processados pelo middleware",
      "Validação removida":
        "Não valida placa manualmente (feito pelo middleware)",
      "Resposta enriquecida": "Inclui informações da API veicular",
    },
    exemplos: {
      "Com placa (dados da API)": {
        placa: "ABC1234",
        descricao_peca: "Peça de teste",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      },
      "Sem placa (dados manuais)": {
        descricao_peca: "Peça de teste",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
        marca: "Volkswagen",
        modelo: "Golf",
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(
    `🎯 Servidor de teste do controller atualizado rodando na porta ${PORT}`
  );
  console.log(
    `📋 Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log("\n🧪 Para testar o controller atualizado:");
  console.log(
    'curl -X POST -H "Content-Type: application/json" -d \'{"placa":"ABC1234","descricao_peca":"Teste","cidade_atendimento":"São Paulo","uf_atendimento":"SP"}\' http://localhost:3004/api/solicitacoes'
  );
  console.log(
    'curl -X POST -H "Content-Type: application/json" -d \'{"descricao_peca":"Teste sem placa","cidade_atendimento":"São Paulo","uf_atendimento":"SP"}\' http://localhost:3004/api/solicitacoes'
  );
});
