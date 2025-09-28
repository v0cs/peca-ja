/**
 * Teste da rota protegida GET /api/auth/me
 *
 * Este arquivo demonstra como testar a rota protegida usando o middleware de autenticação JWT
 */

const axios = require("axios");

// Configuração da API
const API_BASE_URL = "http://localhost:3000/api";

// Função para testar a rota protegida
async function testProtectedRoute() {
  try {
    console.log("🔐 Testando rota protegida GET /api/auth/me...\n");

    // 1. Primeiro, fazer login para obter um token válido
    console.log("1️⃣ Fazendo login para obter token...");

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "teste@exemplo.com", // Substitua por um email válido do seu banco
      senha: "123456", // Substitua por uma senha válida
    });

    if (!loginResponse.data.success) {
      throw new Error("Falha no login: " + loginResponse.data.message);
    }

    const token = loginResponse.data.data.token;
    console.log("✅ Login realizado com sucesso!");
    console.log("🔑 Token obtido:", token.substring(0, 20) + "...\n");

    // 2. Testar a rota protegida com token válido
    console.log("2️⃣ Testando rota /me com token válido...");

    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Rota protegida acessada com sucesso!");
    console.log(
      "👤 Dados do usuário:",
      JSON.stringify(meResponse.data.data, null, 2)
    );
    console.log("");

    // 3. Testar a rota protegida sem token
    console.log("3️⃣ Testando rota /me sem token...");

    try {
      await axios.get(`${API_BASE_URL}/auth/me`);
      console.log("❌ ERRO: Deveria ter retornado 401!");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("✅ Corretamente retornou 401 (não autorizado)");
        console.log("📝 Mensagem:", error.response.data.message);
      } else {
        console.log("❌ ERRO inesperado:", error.message);
      }
    }
    console.log("");

    // 4. Testar a rota protegida com token inválido
    console.log("4️⃣ Testando rota /me com token inválido...");

    try {
      await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: "Bearer token_invalido_123",
        },
      });
      console.log("❌ ERRO: Deveria ter retornado 401!");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("✅ Corretamente retornou 401 (token inválido)");
        console.log("📝 Mensagem:", error.response.data.message);
      } else {
        console.log("❌ ERRO inesperado:", error.message);
      }
    }
    console.log("");

    // 5. Testar a rota protegida com formato de header incorreto
    console.log("5️⃣ Testando rota /me com formato de header incorreto...");

    try {
      await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Token ${token}`, // Formato incorreto (deveria ser Bearer)
        },
      });
      console.log("❌ ERRO: Deveria ter retornado 401!");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("✅ Corretamente retornou 401 (formato incorreto)");
        console.log("📝 Mensagem:", error.response.data.message);
      } else {
        console.log("❌ ERRO inesperado:", error.message);
      }
    }

    console.log("\n🎉 Todos os testes da rota protegida foram executados!");
  } catch (error) {
    console.error("❌ Erro durante os testes:", error.message);

    if (error.response) {
      console.error("📊 Status:", error.response.status);
      console.error("📝 Resposta:", error.response.data);
    }
  }
}

// Executar os testes se este arquivo for executado diretamente
if (require.main === module) {
  testProtectedRoute();
}

module.exports = { testProtectedRoute };
