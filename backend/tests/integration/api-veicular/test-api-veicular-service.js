const apiVeicularService = require("./src/services/apiVeicularService");

/**
 * Teste do Serviço de API Veicular
 * Demonstra como usar o serviço e suas funcionalidades
 */

async function testarApiVeicular() {
  console.log("🚗 Testando Serviço de API Veicular");
  console.log("=".repeat(50));

  // 1. Verificar configuração
  console.log("\n1. Verificando configuração:");
  const configuracaoOk = apiVeicularService.verificarConfiguracao();
  console.log(`✅ API configurada: ${configuracaoOk}`);

  // 2. Testar normalização de placa
  console.log("\n2. Testando normalização de placas:");
  const placasTeste = ["ABC1234", "abc-1234", "XYZ9876", "1234ABC", "ABC-123"];

  placasTeste.forEach((placa) => {
    const normalizada = apiVeicularService.normalizarPlaca(placa);
    console.log(`   ${placa} → ${normalizada || "INVÁLIDA"}`);
  });

  // 3. Testar consulta de veículo (simulação)
  console.log("\n3. Testando consulta de veículo:");
  const placaTeste = "ABC1234";

  try {
    console.log(`   Consultando placa: ${placaTeste}`);

    // Como não temos API key real, vamos simular o comportamento
    if (
      !apiVeicularService.verificarConfiguracao() ||
      apiVeicularService.apiKey === "demo-key"
    ) {
      console.log("   ⚠️  Usando modo demo (sem API key real)");

      // Simular dados de fallback
      const dadosFallback = apiVeicularService.criarFallbackVeiculo(
        placaTeste,
        new Error("API não configurada")
      );
      console.log("   📋 Dados de fallback:");
      console.log(JSON.stringify(dadosFallback, null, 2));
    } else {
      // Tentar consulta real
      const dadosVeiculo = await apiVeicularService.consultarVeiculoPorPlaca(
        placaTeste
      );
      console.log("   ✅ Dados obtidos:");
      console.log(JSON.stringify(dadosVeiculo, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Erro na consulta: ${error.message}`);
  }

  // 4. Testar cache
  console.log("\n4. Testando funcionalidades de cache:");
  const stats = apiVeicularService.obterEstatisticasCache();
  console.log(`   📊 Estatísticas do cache:`);
  console.log(`      - Chaves: ${stats.keys}`);
  console.log(`      - Hits: ${stats.hits}`);
  console.log(`      - Misses: ${stats.misses}`);
  console.log(`      - TTL: ${stats.ttl} segundos`);

  // 5. Testar limpeza de cache
  console.log("\n5. Testando limpeza de cache:");
  const removido = apiVeicularService.limparCachePlaca(placaTeste);
  console.log(`   🗑️  Cache da placa ${placaTeste} removido: ${removido}`);

  console.log("\n" + "=".repeat(50));
  console.log("✅ Teste do serviço concluído!");
}

// Executar teste se arquivo for chamado diretamente
if (require.main === module) {
  testarApiVeicular().catch(console.error);
}

module.exports = { testarApiVeicular };

