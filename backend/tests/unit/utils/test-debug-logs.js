const { apiVeicularService } = require("./src/services");

/**
 * Teste dos Logs Detalhados de Debug
 * Demonstra os logs temporários adicionados para debug da API veicular
 */

async function testarLogsDetalhados() {
  console.log("🔍 Testando logs detalhados de debug da API veicular...\n");

  // Teste 1: Consulta com placa válida (vai usar fallback devido à API demo)
  console.log("1️⃣ Teste de consulta com placa válida:");
  try {
    const resultado = await apiVeicularService.consultarVeiculoPorPlaca(
      "ABC1234",
      "192.168.1.100"
    );
    console.log("✅ Resultado da consulta:");
    console.log("- Placa:", resultado.placa);
    console.log("- Origem:", resultado.origem_dados_veiculo);
    console.log("- Marca:", resultado.marca);
    console.log("- Modelo:", resultado.modelo);
  } catch (error) {
    console.log("❌ Erro na consulta:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Teste 2: Consulta com placa inválida
  console.log("2️⃣ Teste de consulta com placa inválida:");
  try {
    const resultado = await apiVeicularService.consultarVeiculoPorPlaca(
      "INVALID",
      "192.168.1.101"
    );
    console.log("✅ Resultado da consulta:");
    console.log("- Placa:", resultado.placa);
    console.log("- Origem:", resultado.origem_dados_veiculo);
  } catch (error) {
    console.log("❌ Erro na consulta:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Teste 3: Consulta com placa no formato antigo
  console.log("3️⃣ Teste de consulta com placa no formato antigo:");
  try {
    const resultado = await apiVeicularService.consultarVeiculoPorPlaca(
      "ABC-1234",
      "192.168.1.102"
    );
    console.log("✅ Resultado da consulta:");
    console.log("- Placa:", resultado.placa);
    console.log("- Origem:", resultado.origem_dados_veiculo);
  } catch (error) {
    console.log("❌ Erro na consulta:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Teste 4: Consulta com placa Mercosul
  console.log("4️⃣ Teste de consulta com placa Mercosul:");
  try {
    const resultado = await apiVeicularService.consultarVeiculoPorPlaca(
      "ABC1D23",
      "192.168.1.103"
    );
    console.log("✅ Resultado da consulta:");
    console.log("- Placa:", resultado.placa);
    console.log("- Origem:", resultado.origem_dados_veiculo);
  } catch (error) {
    console.log("❌ Erro na consulta:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Teste 5: Verificar configuração
  console.log("5️⃣ Verificando configuração da API:");
  try {
    const config = apiVeicularService.verificarConfiguracao();
    console.log("✅ Configuração:");
    console.log("- API Configurada:", config.api_configured);
    console.log("- API Key Presente:", config.api_key_present);
    console.log("- API Key Demo:", config.api_key_demo);
    console.log("- Tipo de Autenticação:", config.authentication_type);
    console.log(
      "- Circuit Breaker Habilitado:",
      config.circuit_breaker_enabled
    );
    console.log("- Estado do Circuit Breaker:", config.circuit_breaker_state);
  } catch (error) {
    console.log("❌ Erro ao verificar configuração:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  console.log("🎉 Testes de logs detalhados concluídos!");
  console.log("\n📋 Resumo dos logs implementados:");
  console.log("✅ DEBUG API VEICULAR - Logs antes da requisição");
  console.log("✅ DEBUG API VEICULAR REQUEST - Interceptor de requisição");
  console.log("✅ DEBUG API VEICULAR RESPONSE - Interceptor de resposta");
  console.log("✅ DEBUG API VEICULAR ERROR - Interceptor de erro");
  console.log("✅ DEBUG FALLBACK - Logs detalhados do fallback");

  console.log("\n🔍 Informações capturadas nos logs:");
  console.log("📤 REQUEST:");
  console.log("  - URL completa da requisição");
  console.log("  - Método HTTP (GET)");
  console.log("  - Headers enviados (incluindo Basic Auth)");
  console.log("  - Configuração completa da requisição");
  console.log("  - Parâmetros e dados");

  console.log("\n📥 RESPONSE:");
  console.log("  - Status HTTP da resposta");
  console.log("  - Headers da resposta");
  console.log("  - Dados completos da resposta (JSON formatado)");
  console.log("  - Configuração da requisição original");

  console.log("\n❌ ERROR:");
  console.log("  - Mensagem de erro detalhada");
  console.log("  - Código de erro");
  console.log("  - Status HTTP do erro");
  console.log("  - Dados de erro da API");
  console.log("  - Headers de erro");
  console.log("  - Stack trace completo");

  console.log("\n🚨 FALLBACK:");
  console.log("  - Placa que causou o erro");
  console.log("  - Erro completo capturado");
  console.log("  - Detalhes da resposta de erro");
  console.log("  - Configuração da requisição que falhou");

  console.log("\n💡 Como usar os logs:");
  console.log("1. Execute uma consulta veicular");
  console.log("2. Observe os logs detalhados no console");
  console.log("3. Identifique o problema específico");
  console.log("4. Corrija a configuração ou API key");
  console.log("5. Remova os logs temporários após correção");
}

// Executar os testes
testarLogsDetalhados().catch(console.error);
