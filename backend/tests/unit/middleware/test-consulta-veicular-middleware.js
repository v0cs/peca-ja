const express = require("express");
const {
  consultaVeicularMiddleware,
  consultaVeicularSolicitacoesMiddleware,
  logConsultaVeicularMiddleware,
} = require("./src/middleware/consultaVeicularMiddleware");

/**
 * Teste do Middleware de Consulta Veicular
 * Demonstra como o middleware intercepta e processa requests
 */

const app = express();
const PORT = 3002;

// Middleware para parsing de JSON
app.use(express.json());

// Middleware de consulta veicular
app.use(consultaVeicularMiddleware);

// Middleware de logging
app.use(logConsultaVeicularMiddleware);

// Rota de teste para criação de solicitação
app.post("/api/solicitacoes", (req, res) => {
  console.log("\n📋 Dados recebidos no controller:");
  console.log("Body original:", req.body);
  console.log("Info da API veicular:", req.apiVeicularInfo);

  res.json({
    success: true,
    message: "Solicitação processada com sucesso",
    data: {
      solicitacao: {
        placa: req.body.placa,
        marca: req.body.marca,
        modelo: req.body.modelo,
        ano_fabricacao: req.body.ano_fabricacao,
        ano_modelo: req.body.ano_modelo,
        categoria: req.body.categoria,
        cor: req.body.cor,
        origem_dados_veiculo: req.body.origem_dados_veiculo,
      },
      api_veicular_info: req.apiVeicularInfo,
    },
  });
});

// Rota de teste para outras operações (não deve ser afetada)
app.post("/api/outros", (req, res) => {
  res.json({
    success: true,
    message: "Rota não afetada pelo middleware",
    data: req.body,
  });
});

// Rota de teste específica para solicitações
app.post(
  "/api/teste-solicitacoes",
  consultaVeicularSolicitacoesMiddleware,
  (req, res) => {
    res.json({
      success: true,
      message: "Teste específico de solicitações",
      data: {
        body: req.body,
        apiInfo: req.apiVeicularInfo,
      },
    });
  }
);

// Rota de teste para outras rotas (não deve ser afetada pelo middleware específico)
app.post(
  "/api/teste-outros",
  consultaVeicularSolicitacoesMiddleware,
  (req, res) => {
    res.json({
      success: true,
      message: "Rota não afetada pelo middleware específico",
      data: req.body,
    });
  }
);

// Rota de teste básica
app.get("/test", (req, res) => {
  res.json({
    message:
      "Servidor de teste do middleware de consulta veicular funcionando!",
    endpoints: {
      "POST /api/solicitacoes": "Criação de solicitação com middleware geral",
      "POST /api/outros": "Rota não afetada pelo middleware",
      "POST /api/teste-solicitacoes": "Teste com middleware específico",
      "POST /api/teste-outros": "Teste sem middleware específico",
    },
    exemplos: {
      "Com placa válida": {
        placa: "ABC1234",
        descricao_peca: "Peça de teste",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      },
      "Sem placa": {
        descricao_peca: "Peça de teste",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
        marca: "Volkswagen",
        modelo: "Golf",
      },
      "Com placa inválida": {
        placa: "123ABC",
        descricao_peca: "Peça de teste",
        cidade_atendimento: "São Paulo",
        uf_atendimento: "SP",
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(
    `🚗 Servidor de teste do middleware de consulta veicular rodando na porta ${PORT}`
  );
  console.log(
    `📋 Acesse http://localhost:${PORT}/test para ver os endpoints disponíveis`
  );
  console.log(
    "\n🧪 Para testar o middleware, use uma ferramenta como Postman ou curl:"
  );
  console.log(
    'curl -X POST -H "Content-Type: application/json" -d \'{"placa":"ABC1234","descricao_peca":"Teste"}\' http://localhost:3002/api/solicitacoes'
  );
  console.log(
    'curl -X POST -H "Content-Type: application/json" -d \'{"descricao_peca":"Teste sem placa"}\' http://localhost:3002/api/solicitacoes'
  );
});
