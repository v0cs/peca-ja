import { useState, useEffect } from "react";
import api from "../services/api";

export const useSolicitacoes = () => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/solicitacoes");
      
      if (response.data.success) {
        setSolicitacoes(response.data.data.solicitacoes || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao carregar solicitações");
      console.error("Erro ao buscar solicitações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  return {
    solicitacoes,
    loading,
    error,
    refetch: fetchSolicitacoes,
  };
};





