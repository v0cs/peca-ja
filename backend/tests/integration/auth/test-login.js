const axios = require("axios");

// Configuração para teste local
const API_BASE_URL = "http://localhost:3001";

async function testLogin() {
  console.log("🧪 Testando endpoint de login...\n");

  // Teste 1: Login com credenciais válidas (assumindo que existe um usuário)
  console.log("1️⃣ Teste: Login com credenciais válidas");
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: "teste@exemplo.com",
      senha: "123456",
    });

    console.log("✅ Sucesso:", response.data);
    console.log("Token recebido:", response.data.data?.token ? "Sim" : "Não");
  } catch (error) {
    if (error.response) {
      console.log(
        "❌ Erro esperado (usuário não existe):",
        error.response.data
      );
    } else {
      console.log("❌ Erro de conexão:", error.message);
    }
  }

  console.log("\n2️⃣ Teste: Login sem email");
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      senha: "123456",
    });

    console.log("✅ Sucesso:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "✅ Erro esperado (campos obrigatórios):",
        error.response.data
      );
    } else {
      console.log("❌ Erro de conexão:", error.message);
    }
  }

  console.log("\n3️⃣ Teste: Login sem senha");
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: "teste@exemplo.com",
    });

    console.log("✅ Sucesso:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "✅ Erro esperado (campos obrigatórios):",
        error.response.data
      );
    } else {
      console.log("❌ Erro de conexão:", error.message);
    }
  }

  console.log("\n4️⃣ Teste: Login com email inválido");
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: "naoexiste@exemplo.com",
      senha: "123456",
    });

    console.log("✅ Sucesso:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "✅ Erro esperado (credenciais inválidas):",
        error.response.data
      );
    } else {
      console.log("❌ Erro de conexão:", error.message);
    }
  }
}

// Executar testes
testLogin().catch(console.error);
