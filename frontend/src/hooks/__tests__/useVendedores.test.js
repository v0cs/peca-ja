import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useVendedores } from "../useVendedores";
import api from "../../services/api";

// Mock do api
vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("useVendedores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve inicializar com valores padrão", () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { vendedores: [] } },
    });

    const { result } = renderHook(() => useVendedores(false));

    expect(result.current.vendedores).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.stats).toEqual({ total: 0, ativos: 0, inativos: 0 });
  });

  it("deve buscar vendedores automaticamente quando autoFetch é true", async () => {
    const mockVendedores = [
      { id: 1, nome_completo: "João Silva", ativo: true },
      { id: 2, nome_completo: "Maria Santos", ativo: false },
    ];

    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { vendedores: mockVendedores },
      },
    });

    const { result } = renderHook(() => useVendedores(true));

    expect(api.get).toHaveBeenCalledWith("/vendedores");

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.vendedores).toEqual(mockVendedores);
    expect(result.current.stats).toEqual({
      total: 2,
      ativos: 1,
      inativos: 1,
    });
  });

  it("deve calcular estatísticas corretamente", async () => {
    const mockVendedores = [
      { id: 1, nome_completo: "João Silva", ativo: true },
      { id: 2, nome_completo: "Maria Santos", ativo: true },
      { id: 3, nome_completo: "Pedro Costa", ativo: false },
    ];

    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { vendedores: mockVendedores },
      },
    });

    const { result } = renderHook(() => useVendedores(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      total: 3,
      ativos: 2,
      inativos: 1,
    });
  });

  it("deve buscar vendedor por ID", async () => {
    const mockVendedores = [
      { id: 1, nome_completo: "João Silva", ativo: true },
      { id: 2, nome_completo: "Maria Santos", ativo: false },
    ];

    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { vendedores: mockVendedores },
      },
    });

    const { result } = renderHook(() => useVendedores(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const vendedor = result.current.buscarVendedorPorId(1);
    expect(vendedor).toEqual(mockVendedores[0]);
  });

  it("deve filtrar vendedores por status", async () => {
    const mockVendedores = [
      { id: 1, nome_completo: "João Silva", ativo: true },
      { id: 2, nome_completo: "Maria Santos", ativo: false },
      { id: 3, nome_completo: "Pedro Costa", ativo: true },
    ];

    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { vendedores: mockVendedores },
      },
    });

    const { result } = renderHook(() => useVendedores(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const ativos = result.current.filtrarVendedoresPorStatus("ativos");
    expect(ativos).toHaveLength(2);
    expect(ativos.every((v) => v.ativo)).toBe(true);

    const inativos = result.current.filtrarVendedoresPorStatus("inativos");
    expect(inativos).toHaveLength(1);
    expect(inativos.every((v) => !v.ativo)).toBe(true);

    const todos = result.current.filtrarVendedoresPorStatus("todos");
    expect(todos).toHaveLength(3);
  });

  it("deve buscar vendedores por nome ou email", async () => {
    const mockVendedores = [
      {
        id: 1,
        nome_completo: "João Silva",
        usuario: { email: "joao@exemplo.com" },
        ativo: true,
      },
      {
        id: 2,
        nome_completo: "Maria Santos",
        usuario: { email: "maria@exemplo.com" },
        ativo: false,
      },
    ];

    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { vendedores: mockVendedores },
      },
    });

    const { result } = renderHook(() => useVendedores(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const resultados = result.current.buscarVendedores("João");
    expect(resultados).toHaveLength(1);
    expect(resultados[0].nome_completo).toBe("João Silva");

    const resultadosEmail = result.current.buscarVendedores("maria@");
    expect(resultadosEmail).toHaveLength(1);
    expect(resultadosEmail[0].nome_completo).toBe("Maria Santos");
  });

  it("deve criar vendedor com sucesso", async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { vendedores: [] } },
    });

    api.post.mockResolvedValue({
      data: {
        success: true,
        data: { id: 1, nome_completo: "Novo Vendedor" },
        message: "Vendedor criado com sucesso",
      },
    });

    const { result } = renderHook(() => useVendedores(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const novoVendedor = {
      nome: "Novo Vendedor",
      email: "novo@exemplo.com",
    };

    const criarPromise = result.current.criarVendedor(novoVendedor);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const resultado = await criarPromise;

    expect(api.post).toHaveBeenCalledWith("/vendedores", novoVendedor);
    expect(resultado.success).toBe(true);
    expect(api.get).toHaveBeenCalledWith("/vendedores"); // Refetch após criar
  });

  it("deve atualizar vendedor com sucesso", async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { vendedores: [] } },
    });

    api.put.mockResolvedValue({
      data: {
        success: true,
        data: { id: 1, nome_completo: "Vendedor Atualizado" },
        message: "Vendedor atualizado com sucesso",
      },
    });

    const { result } = renderHook(() => useVendedores(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const dadosAtualizacao = { nome_completo: "Vendedor Atualizado" };

    const atualizarPromise = result.current.atualizarVendedor(1, dadosAtualizacao);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const resultado = await atualizarPromise;

    expect(api.put).toHaveBeenCalledWith("/vendedores/1", dadosAtualizacao);
    expect(resultado.success).toBe(true);
    expect(api.get).toHaveBeenCalledWith("/vendedores"); // Refetch após atualizar
  });

  it("deve inativar vendedor com sucesso", async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { vendedores: [] } },
    });

    api.delete.mockResolvedValue({
      data: {
        success: true,
        data: { id: 1, ativo: false },
        message: "Vendedor inativado com sucesso",
      },
    });

    const { result } = renderHook(() => useVendedores(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const inativarPromise = result.current.inativarVendedor(1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const resultado = await inativarPromise;

    expect(api.delete).toHaveBeenCalledWith("/vendedores/1");
    expect(resultado.success).toBe(true);
    expect(api.get).toHaveBeenCalledWith("/vendedores"); // Refetch após inativar
  });

  it("deve reativar vendedor com sucesso", async () => {
    api.get.mockResolvedValue({
      data: { success: true, data: { vendedores: [] } },
    });

    api.patch.mockResolvedValue({
      data: {
        success: true,
        data: { id: 1, ativo: true },
        message: "Vendedor reativado com sucesso",
      },
    });

    const { result } = renderHook(() => useVendedores(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const reativarPromise = result.current.reativarVendedor(1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const resultado = await reativarPromise;

    expect(api.patch).toHaveBeenCalledWith("/vendedores/1/reativar");
    expect(resultado.success).toBe(true);
    expect(api.get).toHaveBeenCalledWith("/vendedores"); // Refetch após reativar
  });

  it("deve tratar erro ao buscar vendedores", async () => {
    api.get.mockRejectedValue({
      response: {
        data: { message: "Erro ao buscar vendedores" },
      },
    });

    const { result } = renderHook(() => useVendedores(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Erro ao buscar vendedores");
    expect(result.current.vendedores).toEqual([]);
  });
});

