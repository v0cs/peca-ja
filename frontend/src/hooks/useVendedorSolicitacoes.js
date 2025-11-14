import { useEffect, useState } from "react";
import api from "../services/api";

const ENDPOINTS = {
  disponiveis: "/vendedor/solicitacoes-disponiveis",
  vistas: "/vendedor/solicitacoes-vistas",
  atendidas: "/vendedor/solicitacoes-atendidas",
};

export const useVendedorSolicitacoes = (filtro = "disponiveis", skip = false) => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const fetchSolicitacoes = async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint = ENDPOINTS[filtro] || ENDPOINTS.disponiveis;
      const response = await api.get(endpoint);

      if (response.data.success) {
        const lista = response.data.data.solicitacoes || [];
        const mapa = new Map();
        const semChave = [];

        lista.forEach((item) => {
          const chave = item?.id ?? item?.solicitacao_id;
          if (chave) {
            if (!mapa.has(chave)) {
              mapa.set(chave, item);
            }
          } else {
            semChave.push(item);
          }
        });

        setSolicitacoes([...mapa.values(), ...semChave]);
      } else {
        setSolicitacoes([]);
      }
    } catch (err) {
      if (err.response?.status !== 403) {
        const message =
          err.response?.data?.message || "Erro ao carregar solicitações";
        setError(message);
        console.error("[useVendedorSolicitacoes] Erro ao buscar solicitações:", err);
      }
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, skip]);

  const atenderSolicitacao = async (solicitacaoId) => {
    try {
      const response = await api.post(
        `/vendedor/solicitacoes/${solicitacaoId}/atender`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Erro ao atender solicitação"
      );
    }
  };

  const marcarComoVista = async (solicitacaoId) => {
    try {
      const response = await api.post(
        `/vendedor/solicitacoes/${solicitacaoId}/marcar-vista`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          "Erro ao marcar solicitação como vista"
      );
    }
  };

  const desmarcarComoVista = async (solicitacaoId) => {
    try {
      const response = await api.delete(
        `/vendedor/solicitacoes/${solicitacaoId}/marcar-vista`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          "Erro ao retornar solicitação ao dashboard"
      );
    }
  };

  const desmarcarComoAtendida = async (solicitacaoId) => {
    try {
      const response = await api.delete(
        `/vendedor/solicitacoes/${solicitacaoId}/atender`
      );

      if (response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          "Erro ao reabrir a solicitação para atendimento"
      );
    }
  };

  return {
    solicitacoes,
    loading,
    error,
    refetch: fetchSolicitacoes,
    atenderSolicitacao,
    marcarComoVista,
    desmarcarComoVista,
    desmarcarComoAtendida,
  };
};


