import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticação ao iniciar via cookie httpOnly
  // Não salvamos dados no localStorage - sempre buscamos do backend
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/auth/me");
        if (response.data.success) {
          const userData = response.data.data;
          const perfil = userData.cliente || userData.autopeca || userData.vendedor || null;
          const fullUserData = {
            ...userData.usuario,
            cliente: userData.cliente || null,
            autopeca: userData.autopeca || null,
            vendedor: userData.vendedor || null,
            perfil: perfil,
          };
          setUser(fullUserData);
        } else {
          setUser(null);
        }
      } catch (error) {
        // Se falhar (401, etc.), usuário não está autenticado
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (email, senha) => {
    try {
      const response = await api.post("/auth/login", { email, senha });

      if (response.data.success) {
        const {
          usuario,
          cliente,
          autopeca,
          vendedor,
        } = response.data.data;

        // Token está em cookie httpOnly (não acessível via JavaScript)
        // Não salvamos dados no localStorage - mantemos apenas no estado
        const perfil = cliente || autopeca || vendedor || null;
        const userData = {
          ...usuario,
          cliente: cliente || null,
          autopeca: autopeca || null,
          vendedor: vendedor || null,
          perfil: perfil,
        };
        setUser(userData);
        setToken(null); // Token não está no localStorage

        return { success: true, user: userData };
      }

      return {
        success: false,
        message: response.data.message || "Erro ao fazer login",
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erro ao fazer login. Verifique suas credenciais.";
      return { success: false, message };
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      // Sempre chamar endpoint de logout para limpar cookie httpOnly
      // Backend limpará o cookie mesmo se não houver autenticação ativa
      await api.post("/auth/logout");
    } catch (error) {
      // Mesmo se falhar, limpar estado local
      console.error("Erro ao fazer logout no servidor:", error);
    } finally {
      // Limpar estado
      // Cookie será limpo automaticamente pelo backend no logout
      setToken(null);
      setUser(null);
    }
  };

  // Função para atualizar dados do usuário
  // Token está em cookie httpOnly, não salvamos dados no localStorage
  const updateUser = (userData) => {
    setUser(userData);
    setToken(null); // Token não está no localStorage
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    // Autenticação agora é verificada via cookie httpOnly
    // Se temos dados do usuário, assumimos autenticado (backend valida via cookie)
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
