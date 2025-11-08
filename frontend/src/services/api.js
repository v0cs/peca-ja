import axios from "axios";

// Criar instância do axios com configuração base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Se for FormData, remover Content-Type para axios configurar automaticamente com boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratar erro de conexão
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      console.error("❌ Erro de conexão com o backend:", {
        message: "Não foi possível conectar ao servidor",
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        hint: "Verifique se o backend está rodando em http://localhost:3001",
      });

      // Retornar erro mais descritivo
      error.response = {
        data: {
          success: false,
          message:
            "Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3001",
        },
        status: 0,
      };
    }

    // Se receber 401 (não autorizado), remover token e redirecionar para login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Só redirecionar se não estiver já na página de login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
