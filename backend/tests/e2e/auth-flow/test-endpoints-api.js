const axios = require("axios");

/**
 * Teste de diferentes endpoints da API consultarplaca.com.br
 * Para identificar o endpoint correto
 */

async function testarEndpoints() {
  const apiKey = "c68ed7cedc6d247491a1cd0561b30d16";
  const basicAuth = Buffer.from(`${apiKey}:`).toString("base64");

  const headers = {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const endpoints = [
    "https://api.consultarplaca.com.br/consulta-placa/ABC1234",
    "https://api.consultarplaca.com.br/v1/consulta-placa/ABC1234",
    "https://api.consultarplaca.com.br/api/consulta-placa/ABC1234",
    "https://api.consultarplaca.com.br/placa/ABC1234",
    "https://api.consultarplaca.com.br/v1/placa/ABC1234",
    "https://api.consultarplaca.com.br/api/placa/ABC1234",
    "https://api.consultarplaca.com.br/consulta/ABC1234",
    "https://api.consultarplaca.com.br/v1/consulta/ABC1234",
    "https://api.consultarplaca.com.br/api/consulta/ABC1234",
  ];

  console.log(
    "🔍 Testando diferentes endpoints da API consultarplaca.com.br...\n"
  );
  console.log(`🔑 API Key: ${apiKey}`);
  console.log(`🔑 Basic Auth: Basic ${basicAuth}`);
  console.log(`🔑 Headers:`, headers);
  console.log("\n" + "=".repeat(80) + "\n");

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`${i + 1}️⃣ Testando endpoint: ${endpoint}`);

    try {
      const response = await axios.get(endpoint, {
        headers,
        timeout: 10000,
      });

      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      console.log(`✅ Headers:`, response.headers);
      console.log(`✅ Data:`, JSON.stringify(response.data, null, 2));

      if (response.status === 200) {
        console.log(`🎉 ENDPOINT CORRETO ENCONTRADO: ${endpoint}`);
        break;
      }
    } catch (error) {
      console.log(
        `❌ Status: ${error.response?.status || "No response"} ${
          error.response?.statusText || "Error"
        }`
      );
      console.log(`❌ Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`❌ Data:`, JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log("\n" + "-".repeat(60) + "\n");
  }

  console.log("🎉 Teste de endpoints concluído!");
}

// Executar os testes
testarEndpoints().catch(console.error);
