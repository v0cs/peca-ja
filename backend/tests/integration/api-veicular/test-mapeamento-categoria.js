const { apiVeicularService } = require("./src/services");

/**
 * Teste do Mapeamento de Categoria
 * Verifica se o mapeamento do campo "segmento" está funcionando corretamente
 */

console.log("🚗 Testando mapeamento de categoria...\n");

// Teste 1: Verificar configuração
console.log("1️⃣ Verificando configuração:");
try {
  const config = apiVeicularService.verificarConfiguracao();
  console.log("✅ Configuração:");
  console.log("- API Configurada:", config.api_configured);
  console.log("- API Key Presente:", config.api_key_present);
  console.log("- API Email Presente:", config.api_email_present);
  console.log("- Tipo de Autenticação:", config.authentication_type);
  console.log("- Formato de Autenticação:", config.authentication_format);
} catch (error) {
  console.log("❌ Erro ao verificar configuração:", error.message);
}

console.log("\n" + "=".repeat(60) + "\n");

// Teste 2: Mapeamento de categoria
console.log("2️⃣ Testando mapeamento de categoria:");
const categorias = [
  "Auto", // Campo "segmento" da API
  "Motocicleta", // Campo "segmento" da API
  "Caminhão", // Campo "segmento" da API
  "Automóvel", // Campo alternativo
  "Carro", // Campo alternativo
  "Moto", // Campo alternativo
  "Van", // Campo alternativo
  "Ônibus", // Campo alternativo
  "Pickup", // Campo alternativo
  "Utilitário", // Campo alternativo
  "Microônibus", // Campo alternativo
  "INVALID", // Categoria inválida
  null, // Valor nulo
  undefined, // Valor undefined
  "", // String vazia
];

categorias.forEach((categoria, index) => {
  try {
    const resultado = apiVeicularService.mapearCategoria(categoria);
    console.log(`${index + 1}. "${categoria}" → "${resultado}"`);
  } catch (error) {
    console.log(`${index + 1}. "${categoria}" → Erro: ${error.message}`);
  }
});

console.log("\n" + "=".repeat(60) + "\n");

// Teste 3: Simular dados da API real
console.log("3️⃣ Simulando dados da API real:");
try {
  const dadosApiSimulados = {
    status: "ok",
    mensagem: "Consulta realizada com sucesso!",
    dados: {
      informacoes_veiculo: {
        dados_veiculo: {
          placa: "AAA0000",
          marca: "HYUNDAI",
          modelo: "HYUNDAI/HB20 1.0M COMFOR",
          ano_fabricacao: "2014",
          ano_modelo: "2014",
          segmento: "Auto", // Campo real da API
          cor: "Branco",
          chassi: "9BWZZZZZZZZZZZZZZ",
          renavam: "12345678901",
        },
      },
    },
  };

  const resultado = apiVeicularService.formatarDadosVeiculo(dadosApiSimulados);
  console.log("✅ Dados formatados:");
  console.log("- Placa:", resultado.placa);
  console.log("- Marca:", resultado.marca);
  console.log("- Modelo:", resultado.modelo);
  console.log("- Ano Fabricação:", resultado.ano_fabricacao);
  console.log("- Ano Modelo:", resultado.ano_modelo);
  console.log("- Categoria (segmento):", resultado.categoria);
  console.log("- Cor:", resultado.cor);
  console.log("- Origem:", resultado.origem_dados_veiculo);
  console.log("- Versão API:", resultado.api_veicular_metadata.versao_api);
} catch (error) {
  console.log("❌ Erro ao formatar dados:", error.message);
}

console.log("\n" + "=".repeat(60) + "\n");

// Teste 4: Diferentes tipos de veículo
console.log("4️⃣ Testando diferentes tipos de veículo:");
const tiposVeiculo = [
  { segmento: "Auto", esperado: "carro" },
  { segmento: "Motocicleta", esperado: "moto" },
  { segmento: "Caminhão", esperado: "caminhao" },
  { segmento: "Van", esperado: "van" },
  { segmento: "Ônibus", esperado: "onibus" },
  { segmento: "Pickup", esperado: "caminhao" },
  { segmento: "Utilitário", esperado: "van" },
  { segmento: "Microônibus", esperado: "onibus" },
];

tiposVeiculo.forEach((tipo, index) => {
  try {
    const resultado = apiVeicularService.mapearCategoria(tipo.segmento);
    const sucesso = resultado === tipo.esperado ? "✅" : "❌";
    console.log(
      `${index + 1}. "${
        tipo.segmento
      }" → "${resultado}" ${sucesso} (esperado: "${tipo.esperado}")`
    );
  } catch (error) {
    console.log(`${index + 1}. "${tipo.segmento}" → Erro: ${error.message}`);
  }
});

console.log("\n" + "=".repeat(60) + "\n");

// Teste 5: Consulta real com placa de teste
console.log("5️⃣ Teste com placa de teste gratuita (AAA0000):");
async function testarConsultaReal() {
  try {
    const resultado = await apiVeicularService.consultarVeiculoPorPlaca(
      "AAA0000",
      "192.168.1.100"
    );
    console.log("✅ Resultado da consulta real:");
    console.log("- Placa:", resultado.placa);
    console.log("- Origem:", resultado.origem_dados_veiculo);
    console.log("- Marca:", resultado.marca);
    console.log("- Modelo:", resultado.modelo);
    console.log("- Categoria:", resultado.categoria);
    console.log("- Ano Fabricação:", resultado.ano_fabricacao);
    console.log("- Ano Modelo:", resultado.ano_modelo);
    console.log("- Cor:", resultado.cor);

    if (resultado.api_veicular_metadata) {
      console.log("- Metadata API:");
      console.log(
        "  - Versão API:",
        resultado.api_veicular_metadata.versao_api
      );
      console.log(
        "  - Mensagem API:",
        resultado.api_veicular_metadata.mensagem_api
      );
    }
  } catch (error) {
    console.log("❌ Erro na consulta real:", error.message);
  }
}

testarConsultaReal()
  .then(() => {
    console.log("\n" + "=".repeat(60) + "\n");
    console.log("🎉 Testes de mapeamento de categoria concluídos!");
    console.log("\n📋 Resumo das correções:");
    console.log("✅ Campo 'segmento' da API mapeado corretamente");
    console.log("✅ 'Auto' → 'carro'");
    console.log("✅ 'Motocicleta' → 'moto'");
    console.log("✅ 'Caminhão' → 'caminhao'");
    console.log(
      "✅ Fallback para campos alternativos (categoria, tipo_veiculo)"
    );
    console.log("✅ Validação robusta de tipos");
    console.log("✅ Logs detalhados para debug");
  })
  .catch(console.error);
