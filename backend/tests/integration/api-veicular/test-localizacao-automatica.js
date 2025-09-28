const { apiVeicularService } = require("./src/services");

/**
 * Teste da Funcionalidade de Localização Automática
 * Demonstra como o sistema usa a cidade/estado do perfil do cliente como padrão
 */

console.log("🏠 Testando funcionalidade de localização automática...\n");

// Simular dados de um cliente cadastrado
const clienteExemplo = {
  id: "cliente-123",
  usuario_id: "usuario-123",
  nome_completo: "João Silva",
  telefone: "(11) 1234-5678",
  celular: "(11) 98765-4321",
  cidade: "São Paulo",
  uf: "SP",
};

console.log("1️⃣ Dados do cliente cadastrado:");
console.log("- Nome:", clienteExemplo.nome_completo);
console.log("- Cidade:", clienteExemplo.cidade);
console.log("- UF:", clienteExemplo.uf);

console.log("\n" + "=".repeat(60) + "\n");

// Simular diferentes cenários de criação de solicitação
const cenarios = [
  {
    nome: "Cenário 1: Cliente NÃO informa cidade/estado",
    descricao: "Solicitação sem cidade_atendimento e uf_atendimento",
    dados: {
      descricao_peca: "Freio dianteiro",
      placa: "ABC1234",
      marca: "Volkswagen",
      modelo: "Golf",
      ano_fabricacao: 2020,
      ano_modelo: 2020,
      categoria: "carro",
      cor: "Branco",
      // cidade_atendimento: undefined (não informado)
      // uf_atendimento: undefined (não informado)
    },
    resultadoEsperado: {
      cidade_final: "São Paulo",
      uf_final: "SP",
      origem: "perfil_cliente",
    },
  },
  {
    nome: "Cenário 2: Cliente informa cidade/estado diferentes",
    descricao:
      "Solicitação com cidade_atendimento e uf_atendimento específicos",
    dados: {
      descricao_peca: "Pneu dianteiro",
      placa: "XYZ9876",
      marca: "Toyota",
      modelo: "Corolla",
      ano_fabricacao: 2019,
      ano_modelo: 2019,
      categoria: "carro",
      cor: "Prata",
      cidade_atendimento: "Campinas",
      uf_atendimento: "SP",
    },
    resultadoEsperado: {
      cidade_final: "Campinas",
      uf_final: "SP",
      origem: "informada_pelo_cliente",
    },
  },
  {
    nome: "Cenário 3: Cliente informa apenas cidade",
    descricao: "Solicitação com cidade_atendimento mas sem uf_atendimento",
    dados: {
      descricao_peca: "Bateria",
      placa: "DEF5555",
      marca: "Honda",
      modelo: "Civic",
      ano_fabricacao: 2021,
      ano_modelo: 2021,
      categoria: "carro",
      cor: "Azul",
      cidade_atendimento: "Santos",
      // uf_atendimento: undefined (não informado)
    },
    resultadoEsperado: {
      cidade_final: "Santos",
      uf_final: "SP", // Usa UF do perfil
      origem: "informada_pelo_cliente",
    },
  },
];

// Simular lógica do controller
function simularCriacaoSolicitacao(cliente, dadosSolicitacao) {
  console.log("📋 Dados da solicitação recebidos:");
  console.log("- Descrição:", dadosSolicitacao.descricao_peca);
  console.log("- Placa:", dadosSolicitacao.placa);
  console.log(
    "- Cidade informada:",
    dadosSolicitacao.cidade_atendimento || "não informada"
  );
  console.log(
    "- UF informada:",
    dadosSolicitacao.uf_atendimento || "não informada"
  );

  // Lógica do controller: usar cidade/estado do perfil como padrão
  const cidadeFinal = dadosSolicitacao.cidade_atendimento || cliente.cidade;
  const ufFinal = dadosSolicitacao.uf_atendimento || cliente.uf;

  console.log("\n🏠 Lógica de localização:");
  console.log("- Cidade do perfil:", cliente.cidade);
  console.log("- UF do perfil:", cliente.uf);
  console.log("- Cidade final:", cidadeFinal);
  console.log("- UF final:", ufFinal);

  const origemLocalizacao = dadosSolicitacao.cidade_atendimento
    ? "informada_pelo_cliente"
    : "perfil_cliente";

  console.log("- Origem da localização:", origemLocalizacao);

  return {
    cidade_final: cidadeFinal,
    uf_final: ufFinal,
    origem: origemLocalizacao,
  };
}

// Executar testes
cenarios.forEach((cenario, index) => {
  console.log(`${index + 1}️⃣ ${cenario.nome}`);
  console.log(`📝 ${cenario.descricao}`);

  const resultado = simularCriacaoSolicitacao(clienteExemplo, cenario.dados);

  console.log("\n✅ Resultado:");
  console.log("- Cidade final:", resultado.cidade_final);
  console.log("- UF final:", resultado.uf_final);
  console.log("- Origem:", resultado.origem);

  // Verificar se resultado está correto
  const sucesso =
    resultado.cidade_final === cenario.resultadoEsperado.cidade_final &&
    resultado.uf_final === cenario.resultadoEsperado.uf_final &&
    resultado.origem === cenario.resultadoEsperado.origem;

  console.log(`🎯 Status: ${sucesso ? "✅ CORRETO" : "❌ INCORRETO"}`);

  if (!sucesso) {
    console.log("❌ Esperado:", cenario.resultadoEsperado);
    console.log("❌ Obtido:", resultado);
  }

  console.log("\n" + "=".repeat(60) + "\n");
});

// Simular resposta da API
console.log("📤 Exemplo de resposta da API:");
const exemploResposta = {
  success: true,
  message: "Solicitação criada com 0 imagem(ns)",
  data: {
    solicitacao: {
      id: "solicitacao-123",
      placa: "ABC1234",
      marca: "Volkswagen",
      modelo: "Golf",
      cidade_atendimento: "São Paulo", // Usado automaticamente do perfil
      uf_atendimento: "SP", // Usado automaticamente do perfil
      origem_dados_veiculo: "api",
    },
    localizacao_info: {
      cidade_informada: null, // Cliente não informou
      uf_informada: null, // Cliente não informou
      cidade_perfil_cliente: "São Paulo",
      uf_perfil_cliente: "SP",
      cidade_final_usada: "São Paulo",
      uf_final_usada: "SP",
      origem_localizacao: "perfil_cliente",
    },
  },
};

console.log(JSON.stringify(exemploResposta, null, 2));

console.log("\n" + "=".repeat(60) + "\n");
console.log("🎉 Testes de localização automática concluídos!");
console.log("\n📋 Resumo da funcionalidade:");
console.log("✅ Cliente cadastrado com cidade/estado no perfil");
console.log("✅ Sistema usa perfil como padrão se não informado");
console.log(
  "✅ Cliente pode sobrescrever informando cidade/estado específicos"
);
console.log("✅ Resposta inclui informações sobre origem da localização");
console.log("✅ Logs detalhados para debug");
console.log(
  "✅ Flexibilidade: cliente pode solicitar atendimento em cidade diferente"
);
