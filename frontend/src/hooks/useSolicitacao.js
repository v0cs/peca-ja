import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const useSolicitacao = (id) => {
  const [solicitacao, setSolicitacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchSolicitacao();
    }
  }, [id]);

  const fetchSolicitacao = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/solicitacoes/${id}`);
      
      if (response.data.success) {
        setSolicitacao(response.data.data.solicitacao);
      } else {
        setError(response.data.message || "Erro ao carregar solicitação");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Erro ao carregar solicitação";
      setError(message);
      
      if (err.response?.status === 404) {
        // Redirecionar para dashboard correto baseado no tipo de usuário
        const tipoUsuario = user?.tipo_usuario || user?.tipo;
        if (tipoUsuario === "autopeca") {
          navigate("/dashboard/autopeca");
        } else if (tipoUsuario === "vendedor") {
          navigate("/dashboard/vendedor");
        } else {
          navigate("/dashboard/cliente");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const atualizarSolicitacao = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/solicitacoes/${id}`, data);
      
      if (response.data.success) {
        setSolicitacao(response.data.data.solicitacao);
        return { success: true, data: response.data.data.solicitacao };
      } else {
        const errorMsg = response.data.message || "Erro ao atualizar solicitação";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Erro ao atualizar solicitação";
      const errors = err.response?.data?.errors || {};
      setError(message);
      return { success: false, message, errors };
    } finally {
      setLoading(false);
    }
  };

  const cancelarSolicitacao = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.delete(`/solicitacoes/${id}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        const errorMsg = response.data.message || "Erro ao cancelar solicitação";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Erro ao cancelar solicitação";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  return {
    solicitacao,
    loading,
    error,
    refetch: fetchSolicitacao,
    atualizarSolicitacao,
    cancelarSolicitacao,
  };
};

export default useSolicitacao;


