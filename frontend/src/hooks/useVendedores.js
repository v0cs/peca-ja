import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

/**
 * Hook para gerenciar operações de vendedores
 * @param {boolean} autoFetch - Se deve buscar vendedores automaticamente ao montar
 */
export const useVendedores = (autoFetch = true) => {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
  });

  /**
   * Buscar lista de vendedores
   */
  const fetchVendedores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/vendedores");

      if (response.data.success) {
        const vendedoresData = response.data.data.vendedores || [];
        setVendedores(vendedoresData);

        // Calcular estatísticas
        const ativos = vendedoresData.filter((v) => v.ativo).length;
        const inativos = vendedoresData.filter((v) => !v.ativo).length;

        setStats({
          total: vendedoresData.length,
          ativos,
          inativos,
        });
      } else {
        throw new Error(response.data.message || "Erro ao buscar vendedores");
      }
    } catch (err) {
      console.error("Erro ao buscar vendedores:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erro ao carregar vendedores"
      );
      setVendedores([]);
      setStats({ total: 0, ativos: 0, inativos: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Criar novo vendedor
   */
  const criarVendedor = useCallback(
    async (dadosVendedor) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.post("/vendedores", dadosVendedor);

        if (response.data.success) {
          // Atualizar lista de vendedores
          await fetchVendedores();

          return {
            success: true,
            data: response.data.data,
            message: response.data.message,
          };
        } else {
          throw new Error(
            response.data.message || "Erro ao cadastrar vendedor"
          );
        }
      } catch (err) {
        console.error("Erro ao criar vendedor:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Erro ao cadastrar vendedor";

        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
          errors: err.response?.data?.errors,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchVendedores]
  );

  /**
   * Atualizar vendedor existente
   */
  const atualizarVendedor = useCallback(
    async (vendedorId, dadosAtualizacao) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.put(
          `/vendedores/${vendedorId}`,
          dadosAtualizacao
        );

        if (response.data.success) {
          // Atualizar lista de vendedores
          await fetchVendedores();

          return {
            success: true,
            data: response.data.data,
            message: response.data.message,
          };
        } else {
          throw new Error(
            response.data.message || "Erro ao atualizar vendedor"
          );
        }
      } catch (err) {
        console.error("Erro ao atualizar vendedor:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Erro ao atualizar vendedor";

        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
          errors: err.response?.data?.errors,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchVendedores]
  );

  /**
   * Inativar vendedor (soft delete)
   */
  const inativarVendedor = useCallback(
    async (vendedorId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.delete(`/vendedores/${vendedorId}`);

        if (response.data.success) {
          // Atualizar lista de vendedores
          await fetchVendedores();

          return {
            success: true,
            data: response.data.data,
            message: response.data.message,
          };
        } else {
          throw new Error(
            response.data.message || "Erro ao inativar vendedor"
          );
        }
      } catch (err) {
        console.error("Erro ao inativar vendedor:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Erro ao inativar vendedor";

        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
          errors: err.response?.data?.errors,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchVendedores]
  );

  /**
   * Reativar vendedor
   */
  const reativarVendedor = useCallback(
    async (vendedorId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.patch(`/vendedores/${vendedorId}/reativar`);

        if (response.data.success) {
          // Atualizar lista de vendedores
          await fetchVendedores();

          return {
            success: true,
            data: response.data.data,
            message: response.data.message,
          };
        } else {
          throw new Error(
            response.data.message || "Erro ao reativar vendedor"
          );
        }
      } catch (err) {
        console.error("Erro ao reativar vendedor:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Erro ao reativar vendedor";

        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
          errors: err.response?.data?.errors,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchVendedores]
  );

  /**
   * Buscar vendedor por ID
   */
  const buscarVendedorPorId = useCallback(
    (vendedorId) => {
      return vendedores.find((v) => v.id === vendedorId);
    },
    [vendedores]
  );

  /**
   * Filtrar vendedores por status
   */
  const filtrarVendedoresPorStatus = useCallback(
    (status) => {
      if (status === "todos") return vendedores;
      if (status === "ativos") return vendedores.filter((v) => v.ativo);
      if (status === "inativos") return vendedores.filter((v) => !v.ativo);
      return vendedores;
    },
    [vendedores]
  );

  /**
   * Buscar vendedores por nome ou email
   */
  const buscarVendedores = useCallback(
    (query) => {
      if (!query || query.trim() === "") return vendedores;

      const queryLower = query.toLowerCase().trim();

      return vendedores.filter((vendedor) => {
        const nomeMatch = vendedor.nome_completo
          ?.toLowerCase()
          .includes(queryLower);
        const emailMatch = vendedor.usuario?.email
          ?.toLowerCase()
          .includes(queryLower);

        return nomeMatch || emailMatch;
      });
    },
    [vendedores]
  );

  // Auto fetch ao montar componente se autoFetch for true
  useEffect(() => {
    if (autoFetch) {
      fetchVendedores();
    }
  }, [autoFetch, fetchVendedores]);

  return {
    vendedores,
    loading,
    error,
    stats,
    criarVendedor,
    atualizarVendedor,
    inativarVendedor,
    reativarVendedor,
    buscarVendedorPorId,
    filtrarVendedoresPorStatus,
    buscarVendedores,
    refetch: fetchVendedores,
  };
};

export default useVendedores;

