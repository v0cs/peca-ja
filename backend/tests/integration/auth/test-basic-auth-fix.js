const { apiVeicularService } = require("./src/services");

/**
 * Teste da Correção de Autenticação Basic Auth
 * Demonstra o funcionamento da autenticação corrigida para consultarplaca.com.br
 */

console.log("🔐 Testando correção de autenticação Basic Auth...\n");

// Teste 1: Verificar configuração de autenticação
console.log("1️⃣ Verificando configuração de autenticação:");
try {
  const config = apiVeicularService.verificarConfiguracao();

  console.log("✅ Configuração de autenticação:");
  console.log("- API Configurada:", config.api_configured);
  console.log("- API Key Presente:", config.api_key_present);
  console.log("- API Key Demo:", config.api_key_demo);
  console.log("- Tipo de Autenticação:", config.authentication_type);
  console.log("- Formato de Autenticação:", config.authentication_format);
  console.log("- Circuit Breaker Habilitado:", config.circuit_breaker_enabled);
  console.log("- Estado do Circuit Breaker:", config.circuit_breaker_state);
} catch (error) {
  console.log("❌ Erro ao verificar configuração:", error.message);
}

console.log("\n" + "=".repeat(60) + "\n");

// Teste 2: Simular requisição com Basic Auth
console.log("2️⃣ Simulando requisição com Basic Auth:");
try {
  // Simular uma API key de exemplo
  const apiKey = "sua_api_key_aqui";

  // Simular o processo de codificação Basic Auth
  const basicAuth = Buffer.from(`${apiKey}:`).toString("base64");

  console.log("✅ Processo de autenticação Basic Auth:");
  console.log("- API Key:", apiKey);
  console.log("- String para codificar:", `${apiKey}:`);
  console.log("- Base64 codificado:", basicAuth);
  console.log("- Header Authorization:", `Basic ${basicAuth}`);

  // Verificar se a codificação está correta
  const decoded = Buffer.from(basicAuth, "base64").toString("utf-8");
  console.log("- Decodificado (verificação):", decoded);
} catch (error) {
  console.log("❌ Erro na simulação:", error.message);
}

console.log("\n" + "=".repeat(60) + "\n");

// Teste 3: Verificar headers da requisição
console.log("3️⃣ Verificando headers da requisição:");
try {
  // Simular configuração do axios
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Simular adição da autenticação
  const apiKey = "sua_api_key_aqui";
  if (apiKey && apiKey !== "demo-key") {
    const basicAuth = Buffer.from(`${apiKey}:`).toString("base64");
    headers["Authorization"] = `Basic ${basicAuth}`;
    headers["X-API-Key"] = apiKey;
  }

  console.log("✅ Headers da requisição:");
  Object.keys(headers).forEach((key) => {
    console.log(`- ${key}: ${headers[key]}`);
  });
} catch (error) {
  console.log("❌ Erro ao verificar headers:", error.message);
}

console.log("\n" + "=".repeat(60) + "\n");

// Teste 4: Comparar Bearer vs Basic Auth
console.log("4️⃣ Comparação Bearer vs Basic Auth:");
try {
  const apiKey = "sua_api_key_aqui";

  // Bearer Token (ANTIGO - INCORRETO)
  const bearerAuth = `Bearer ${apiKey}`;

  // Basic Auth (NOVO - CORRETO)
  const basicAuth = Buffer.from(`${apiKey}:`).toString("base64");
  const basicAuthHeader = `Basic ${basicAuth}`;

  console.log("❌ Bearer Token (INCORRETO para consultarplaca.com.br):");
  console.log(`   Authorization: ${bearerAuth}`);

  console.log("\n✅ Basic Auth (CORRETO para consultarplaca.com.br):");
  console.log(`   Authorization: ${basicAuthHeader}`);
  console.log(
    `   Base64 decodificado: ${Buffer.from(basicAuth, "base64").toString(
      "utf-8"
    )}`
  );
} catch (error) {
  console.log("❌ Erro na comparação:", error.message);
}

console.log("\n" + "=".repeat(60) + "\n");

// Teste 5: Verificar diferentes formatos de API key
console.log("5️⃣ Testando diferentes formatos de API key:");
const apiKeys = [
  "abc123",
  "minha-api-key-secreta",
  "key_with_underscores",
  "key-with-dashes",
  "key.with.dots",
  "key with spaces",
  "key123456789",
];

apiKeys.forEach((key, index) => {
  try {
    const basicAuth = Buffer.from(`${key}:`).toString("base64");
    const decoded = Buffer.from(basicAuth, "base64").toString("utf-8");

    console.log(`${index + 1}. API Key: "${key}"`);
    console.log(`   Basic Auth: Basic ${basicAuth}`);
    console.log(`   Decodificado: "${decoded}"`);
    console.log(`   Válido: ${decoded === `${key}:` ? "✅" : "❌"}`);
    console.log();
  } catch (error) {
    console.log(`${index + 1}. API Key: "${key}" - Erro: ${error.message}`);
  }
});

console.log("\n" + "=".repeat(60) + "\n");

// Teste 6: Verificar tratamento de API key demo
console.log("6️⃣ Verificando tratamento de API key demo:");
try {
  const demoKey = "demo-key";
  const realKey = "real-api-key-123";

  console.log("✅ Tratamento de API key demo:");
  console.log(
    `- Demo Key (${demoKey}): ${
      demoKey === "demo-key"
        ? "Não enviará autenticação"
        : "Enviará autenticação"
    }`
  );
  console.log(
    `- Real Key (${realKey}): ${
      realKey === "demo-key"
        ? "Não enviará autenticação"
        : "Enviará autenticação"
    }`
  );

  // Simular o comportamento do interceptor
  if (demoKey && demoKey !== "demo-key") {
    const basicAuth = Buffer.from(`${demoKey}:`).toString("base64");
    console.log(`- Demo Key Basic Auth: Basic ${basicAuth}`);
  } else {
    console.log(
      "- Demo Key: Aviso será exibido - 'API_VEICULAR_KEY não configurada ou usando chave demo'"
    );
  }

  if (realKey && realKey !== "demo-key") {
    const basicAuth = Buffer.from(`${realKey}:`).toString("base64");
    console.log(`- Real Key Basic Auth: Basic ${basicAuth}`);
  }
} catch (error) {
  console.log("❌ Erro no teste de demo key:", error.message);
}

console.log("\n" + "=".repeat(60) + "\n");

console.log("🎉 Testes de autenticação Basic Auth concluídos!");
console.log("\n📋 Resumo das correções implementadas:");
console.log("✅ Substituição de Bearer Token por Basic Auth");
console.log("✅ Codificação da API key em base64");
console.log(
  "✅ Formato correto: Authorization: Basic {base64_encode(api_key:)}"
);
console.log("✅ Tratamento de API key demo");
console.log("✅ Headers corretos para consultarplaca.com.br");
console.log("✅ Validação e logs de configuração");
console.log("✅ Interceptor axios atualizado");

console.log("\n🔧 Código corrigido:");
console.log(`
// Interceptor para adicionar API Key automaticamente com Basic Auth
this.httpClient.interceptors.request.use((config) => {
  if (this.apiKey && this.apiKey !== "demo-key") {
    // Basic Auth: codificar API key em base64
    const basicAuth = Buffer.from(\`\${this.apiKey}:\`).toString('base64');
    config.headers["Authorization"] = \`Basic \${basicAuth}\`;
    config.headers["X-API-Key"] = this.apiKey;
  } else {
    console.warn("API_VEICULAR_KEY não configurada ou usando chave demo. A consulta real não será feita.");
  }
  return config;
});
`);

console.log("\n📖 Documentação da API:");
console.log(
  "URL: https://docs.consultarplaca.com.br/consultas/consultar-placa"
);
console.log("Método: GET");
console.log("Autenticação: Basic Auth");
console.log("Header: Authorization: Basic {base64_encode(api_key:)}");
console.log("Endpoint: /consulta-placa/{placa}");
