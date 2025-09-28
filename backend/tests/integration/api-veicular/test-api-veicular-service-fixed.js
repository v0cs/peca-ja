const { apiVeicularService } = require("./src/services");

/**
 * Teste do ApiVeicularService Corrigido
 * Demonstra o funcionamento com validações robustas implementadas
 */

console.log("🧪 Testando ApiVeicularService com validações corrigidas...\n");

// Teste 1: Dados válidos
console.log("1️⃣ Teste com dados válidos:");
try {
  const dadosValidos = {
    placa: "ABC1234",
    marca: "Volkswagen",
    modelo: "Golf",
    ano_fabricacao: 2020,
    ano_modelo: 2020,
    categoria: "carro",
    cor: "Branco",
    chassi: "9BWZZZZZZZZZZZZZZ",
    renavam: "12345678901",
  };

  const resultado = apiVeicularService.formatarDadosVeiculo(dadosValidos);
  console.log("✅ Dados formatados com sucesso:");
  console.log("- Placa:", resultado.placa);
  console.log("- Marca:", resultado.marca);
  console.log("- Modelo:", resultado.modelo);
  console.log("- Origem:", resultado.origem_dados_veiculo);
} catch (error) {
  console.log("❌ Erro:", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Teste 2: Dados com estrutura aninhada
console.log("2️⃣ Teste com dados aninhados:");
try {
  const dadosAninhados = {
    data: {
      placa: "XYZ9876",
      brand: "Ford",
      model: "Focus",
      year_manufacture: 2019,
      year_model: 2019,
      category: "carro",
      color: "Azul",
      chassis: "1FAHP3F20CL123456",
      renavam_number: "98765432109",
    },
  };

  const resultado = apiVeicularService.formatarDadosVeiculo(dadosAninhados);
  console.log("✅ Dados aninhados formatados com sucesso:");
  console.log("- Placa:", resultado.placa);
  console.log("- Marca:", resultado.marca);
  console.log("- Modelo:", resultado.modelo);
  console.log("- Origem:", resultado.origem_dados_veiculo);
} catch (error) {
  console.log("❌ Erro:", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Teste 3: Dados inválidos/null
console.log("3️⃣ Teste com dados inválidos:");
try {
  const dadosInvalidos = null;
  const resultado = apiVeicularService.formatarDadosVeiculo(dadosInvalidos);
  console.log("✅ Dados inválidos tratados:", resultado);
} catch (error) {
  console.log("❌ Erro esperado:", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Teste 4: Dados vazios
console.log("4️⃣ Teste com dados vazios:");
try {
  const dadosVazios = {};
  const resultado = apiVeicularService.formatarDadosVeiculo(dadosVazios);
  console.log("✅ Dados vazios tratados:", resultado);
} catch (error) {
  console.log("❌ Erro esperado:", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Teste 5: Dados com campos undefined
console.log("5️⃣ Teste com campos undefined:");
try {
  const dadosUndefined = {
    placa: undefined,
    marca: null,
    modelo: "",
    ano_fabricacao: "invalid",
    categoria: undefined,
    cor: null,
  };

  const resultado = apiVeicularService.formatarDadosVeiculo(dadosUndefined);
  console.log("✅ Campos undefined tratados:");
  console.log("- Placa:", resultado.placa);
  console.log("- Marca:", resultado.marca);
  console.log("- Modelo:", resultado.modelo);
  console.log("- Ano:", resultado.ano_fabricacao);
  console.log("- Categoria:", resultado.categoria);
  console.log("- Cor:", resultado.cor);
} catch (error) {
  console.log("❌ Erro:", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Teste 6: Mapeamento de marca
console.log("6️⃣ Teste de mapeamento de marca:");
const marcas = ["volkswagen", "FORD", "  toyota  ", null, undefined, "", 123];
marcas.forEach((marca) => {
  try {
    const resultado = apiVeicularService.mapearMarca(marca);
    console.log(`- "${marca}" → "${resultado}"`);
  } catch (error) {
    console.log(`- "${marca}" → Erro: ${error.message}`);
  }
});

console.log("\n" + "=".repeat(50) + "\n");

// Teste 7: Mapeamento de categoria
console.log("7️⃣ Teste de mapeamento de categoria:");
const categorias = [
  "carro",
  "MOTO",
  "  caminhao  ",
  null,
  undefined,
  "",
  "invalid",
];
categorias.forEach((categoria) => {
  try {
    const resultado = apiVeicularService.mapearCategoria(categoria);
    console.log(`- "${categoria}" → "${resultado}"`);
  } catch (error) {
    console.log(`- "${categoria}" → Erro: ${error.message}`);
  }
});

console.log("\n" + "=".repeat(50) + "\n");

// Teste 8: Extração de ano
console.log("8️⃣ Teste de extração de ano:");
const anos = [
  2020,
  "2019",
  "  2021  ",
  "invalid",
  null,
  undefined,
  "",
  1900,
  2030,
];
anos.forEach((ano) => {
  try {
    const resultado = apiVeicularService.extrairAno(ano);
    console.log(`- "${ano}" → "${resultado}"`);
  } catch (error) {
    console.log(`- "${ano}" → Erro: ${error.message}`);
  }
});

console.log("\n" + "=".repeat(50) + "\n");

// Teste 9: Fallback com erro
console.log("9️⃣ Teste de fallback com erro:");
try {
  const erro = new Error("RATE_LIMIT_EXCEEDED: Limite excedido");
  const resultado = apiVeicularService.criarFallbackVeiculo("ABC1234", erro);
  console.log("✅ Fallback criado com sucesso:");
  console.log("- Placa:", resultado.placa);
  console.log("- Origem:", resultado.origem_dados_veiculo);
  console.log("- Tipo de erro:", resultado.api_veicular_metadata.erro.tipo);
} catch (error) {
  console.log("❌ Erro:", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Teste 10: Fallback com erro null
console.log("🔟 Teste de fallback com erro null:");
try {
  const erro = null;
  const resultado = apiVeicularService.criarFallbackVeiculo("ABC1234", erro);
  console.log("✅ Fallback com erro null tratado:");
  console.log("- Placa:", resultado.placa);
  console.log("- Origem:", resultado.origem_dados_veiculo);
  console.log("- Tipo de erro:", resultado.api_veicular_metadata.erro.tipo);
} catch (error) {
  console.log("❌ Erro:", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Teste 11: Consulta completa simulada
console.log("1️⃣1️⃣ Teste de consulta completa simulada:");
try {
  // Simular consulta com dados válidos
  const dadosSimulados = {
    placa: "ABC1234",
    marca: "Volkswagen",
    modelo: "Golf",
    ano_fabricacao: 2020,
    ano_modelo: 2020,
    categoria: "carro",
    cor: "Branco",
    chassi: "9BWZZZZZZZZZZZZZZ",
    renavam: "12345678901",
  };

  // Simular que a API retornou dados válidos
  const resultado = apiVeicularService.formatarDadosVeiculo(dadosSimulados);

  console.log("✅ Consulta simulada bem-sucedida:");
  console.log("- Placa:", resultado.placa);
  console.log("- Marca:", resultado.marca);
  console.log("- Modelo:", resultado.modelo);
  console.log("- Ano Fabricação:", resultado.ano_fabricacao);
  console.log("- Ano Modelo:", resultado.ano_modelo);
  console.log("- Categoria:", resultado.categoria);
  console.log("- Cor:", resultado.cor);
  console.log("- Chassi:", resultado.chassi);
  console.log("- Renavam:", resultado.renavam);
  console.log("- Origem:", resultado.origem_dados_veiculo);
  console.log("- Timestamp:", resultado.api_veicular_metadata.consultado_em);
} catch (error) {
  console.log("❌ Erro na consulta simulada:", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

console.log("🎉 Todos os testes concluídos!");
console.log("\n📋 Resumo das correções implementadas:");
console.log("✅ Validação de dadosApi antes de processar");
console.log("✅ Validação de estrutura de dados (data ou direto)");
console.log("✅ Método extrairCampo para extração segura");
console.log("✅ Try-catch em todos os métodos de mapeamento");
console.log("✅ Validação de tipos antes de usar .includes()");
console.log("✅ Validação de responseData antes de formatar");
console.log("✅ Tratamento de erros null/undefined");
console.log("✅ Logs detalhados para debugging");
console.log("✅ Fallback robusto para todos os cenários");
