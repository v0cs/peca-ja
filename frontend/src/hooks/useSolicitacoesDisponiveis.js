import { useState, useEffect } from "react";
import api from "../services/api";

export const useSolicitacoesDisponiveis = (filtro = "disponiveis", skip = false) => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const fetchSolicitacoes = async () => {
    // Se skip for true, não fazer requisição
    if (skip) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Escolher endpoint baseado no filtro
      let endpoint;
      if (filtro === "atendidas") {
        endpoint = "/autopecas/solicitacoes-atendidas";
      } else if (filtro === "vistas") {
        endpoint = "/autopecas/solicitacoes-vistas";
      } else {
        endpoint = "/autopecas/solicitacoes-disponiveis";
      }
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setSolicitacoes(response.data.data.solicitacoes || []);
      }
    } catch (err) {
      // Apenas logar erro se não for 403 (usuário não autorizado)
      if (err.response?.status !== 403) {
        setError(err.response?.data?.message || "Erro ao carregar solicitações");
        console.error("Erro ao buscar solicitações:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, [filtro, skip]);

  const atenderSolicitacao = async (solicitacaoId) => {
    try {
      const response = await api.post(`/autopecas/solicitacoes/${solicitacaoId}/atender`);
      
      if (response.data.success) {
        // Retornar dados do WhatsApp
        return response.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Erro ao atender solicitação");
    }
  };

  const marcarComoLida = async (solicitacaoId) => {
    try {
      const response = await api.post(`/autopecas/solicitacoes/${solicitacaoId}/marcar-como-lida`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Erro ao marcar solicitação como vista");
    }
  };

  const desmarcarComoVista = async (solicitacaoId) => {
    try {
      const response = await api.delete(`/autopecas/solicitacoes/${solicitacaoId}/marcar-como-lida`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Erro ao retornar solicitação ao dashboard");
    }
  };

  return {
    solicitacoes,
    loading,
    error,
    atenderSolicitacao,
    marcarComoLida,
    desmarcarComoVista,
    refetch: fetchSolicitacoes,
  };
};


