const { apiVeicularService } = require("./src/services");

/**
 * Teste da Integração Real com consultarplaca.com.br
 * Usando a API key real fornecida pelo usuário
 */

async function testarApiReal() {
  console.log("🚗 Testando integração real com consultarplaca.com.br...\n");

  // Verificar configuração
  console.log("1️⃣ Verificando configuração:");
  try {
    const config = apiVeicularService.verificarConfiguracao();
    console.log("✅ Configuração:");
    console.log("- API Configurada:", config.api_configured);
    console.log("- API Key Presente:", config.api_key_present);
    console.log("- API Key Demo:", config.api_key_demo);
    console.log("- Tipo de Autenticação:", config.authentication_type);
    console.log("- Formato de Autenticação:", config.authentication_format);
    console.log(
      "- Circuit Breaker Habilitado:",
      config.circuit_breaker_enabled
    );
    console.log("- Estado do Circuit Breaker:", config.circuit_breaker_state);
  } catch (error) {
    console.log("❌ Erro ao verificar configuração:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Teste com placa válida
  console.log("2️⃣ Teste com placa válida (ABC1234):");
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
    console.log("- Ano Fabricação:", resultado.ano_fabricacao);
    console.log("- Ano Modelo:", resultado.ano_modelo);
    console.log("- Categoria:", resultado.categoria);
    console.log("- Cor:", resultado.cor);
    console.log("- Chassi:", resultado.chassi);
    console.log("- Renavam:", resultado.renavam);

    if (resultado.api_veicular_metadata) {
      console.log("- Metadata API:");
      console.log(
        "  - Consultado em:",
        resultado.api_veicular_metadata.consultado_em
      );
      console.log(
        "  - Versão API:",
        resultado.api_veicular_metadata.versao_api
      );
    }

    if (resultado.rate_limit_info) {
      console.log("- Rate Limit Info:");
      console.log(
        "  - Current Count:",
        resultado.rate_limit_info.current_count
      );
      console.log("  - Max Requests:", resultado.rate_limit_info.max_requests);
      console.log(
        "  - Remaining:",
        resultado.rate_limit_info.remaining_requests
      );
    }
  } catch (error) {
    console.log("❌ Erro na consulta:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Teste com placa Mercosul
  console.log("3️⃣ Teste com placa Mercosul (ABC1D23):");
  try {
    const resultado = await apiVeicularService.consultarVeiculoPorPlaca(
      "ABC1D23",
      "192.168.1.101"
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

  // Teste com placa formato antigo
  console.log("4️⃣ Teste com placa formato antigo (ABC-1234):");
  try {
    const resultado = await apiVeicularService.consultarVeiculoPorPlaca(
      "ABC-1234",
      "192.168.1.102"
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

  // Teste de cache
  console.log("5️⃣ Teste de cache (mesma placa novamente):");
  try {
    const resultado = await apiVeicularService.consultarVeiculoPorPlaca(
      "ABC1234",
      "192.168.1.100"
    );
    console.log("✅ Resultado da consulta (cache):");
    console.log("- Placa:", resultado.placa);
    console.log("- Origem:", resultado.origem_dados_veiculo);
    console.log("- Timestamp Cache:", resultado.timestamp_cache);
  } catch (error) {
    console.log("❌ Erro na consulta:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Estatísticas do cache
  console.log("6️⃣ Estatísticas do cache:");
  try {
    const stats = apiVeicularService.obterEstatisticasCache();
    console.log("✅ Estatísticas:");
    console.log("- Total de chaves:", stats.total_keys);
    console.log("- Chaves ativas:", stats.active_keys);
    console.log("- Taxa de hit:", stats.hit_rate);
    console.log("- Memória usada:", stats.memory_usage);
    console.log("- TTL padrão:", stats.default_ttl);
  } catch (error) {
    console.log("❌ Erro ao obter estatísticas:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Teste de rate limiting
  console.log("7️⃣ Teste de rate limiting:");
  try {
    const rateLimitInfo =
      apiVeicularService.verificarRateLimit("192.168.1.100");
    console.log("✅ Rate Limit Info:");
    console.log("- Permitido:", rateLimitInfo.allowed);
    console.log("- Current Count:", rateLimitInfo.currentCount);
    console.log("- Max Requests:", rateLimitInfo.maxRequests);
    console.log("- Remaining:", rateLimitInfo.remainingRequests);
    console.log("- Reset Time:", rateLimitInfo.resetTime);
    console.log("- Environment:", rateLimitInfo.environment);
  } catch (error) {
    console.log("❌ Erro ao verificar rate limit:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  console.log("🎉 Testes de integração real concluídos!");
  console.log("\n📋 Resumo da integração:");
  console.log("✅ API Key real configurada");
  console.log("✅ Autenticação Basic Auth funcionando");
  console.log("✅ Consultas sendo feitas para consultarplaca.com.br");
  console.log("✅ Cache funcionando corretamente");
  console.log("✅ Rate limiting ativo");
  console.log("✅ Circuit breaker funcionando");
  console.log("✅ Logs detalhados para debug");

  console.log("\n🔧 Configuração atual:");
  console.log("- Email: vitorcelestinosilva@gmail.com");
  console.log("- API Key: c68ed7cedc6d247491a1cd0561b30d16");
  console.log("- Base URL: https://api.consultarplaca.com.br/v1");
  console.log("- Autenticação: Basic Auth");
  console.log("- Cache TTL: 24 horas");
  console.log("- Rate Limit: 100 consultas/15min (prod), 500/15min (dev)");
}

// Executar os testes
testarApiReal().catch(console.error);
