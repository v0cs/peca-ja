import axios from "axios";

// Criar instância do axios com configuração base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enviar cookies automaticamente em todas as requisições
});

// Interceptor para processar requisições
api.interceptors.request.use(
  (config) => {
    // Token agora é enviado via cookie httpOnly (mais seguro)
    // Não precisamos mais ler do localStorage

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
        hint: `Verifique se o backend está rodando em ${
          error.config?.baseURL ||
          import.meta.env.VITE_API_URL ||
          "a URL configurada"
        }`,
      });

      // Retornar erro mais descritivo
      const apiUrl =
        error.config?.baseURL || import.meta.env.VITE_API_URL || "o servidor";
      error.response = {
        data: {
          success: false,
          message: `Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${apiUrl}`,
        },
        status: 0,
      };
    }

    // Se receber 401 (não autorizado), redirecionar para login
    // Cookie httpOnly será limpo automaticamente pelo backend
    if (error.response?.status === 401) {
      // Páginas públicas onde 401 é esperado (não redirecionar)
      const publicRoutes = [
        "/",
        "/login",
        "/cadastrar",
        "/recuperar-senha",
        "/reset-password",
        "/auth/oauth-callback",
        "/politica-privacidade",
      ];

      // Verificar se está em uma página pública
      const currentPath = window.location.pathname;
      const isPublicRoute = publicRoutes.some(
        (route) => currentPath === route || currentPath.startsWith(route + "/")
      );

      // Só redirecionar se não estiver em uma página pública
      // Isso permite que o fluxo de cadastro com OAuth funcione corretamente
      if (!isPublicRoute) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
