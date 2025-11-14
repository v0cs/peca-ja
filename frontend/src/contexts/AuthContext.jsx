import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Função de login
  const login = async (email, senha) => {
    try {
      const response = await api.post("/auth/login", { email, senha });

      if (response.data.success) {
        const {
          token: newToken,
          usuario,
          cliente,
          autopeca,
          vendedor,
        } = response.data.data;

        // Salvar no estado e localStorage
        setToken(newToken);
        const perfil = cliente || autopeca || vendedor || null; // Get the specific profile data
        const userData = {
          ...usuario,
          cliente: cliente || null,
          autopeca: autopeca || null,
          vendedor: vendedor || null,
          perfil: perfil, // Store profile for easy access
        };
        setUser(userData);

        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));

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
      // Chamar endpoint de logout se tiver token
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Erro ao fazer logout no servidor:", error);
    } finally {
      // Limpar estado e localStorage sempre
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // Função para atualizar dados do usuário
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
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
