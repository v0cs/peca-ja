import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSolicitacoes } from "../useSolicitacoes";
import api from "../../services/api";

// Mock do api
vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("useSolicitacoes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar solicitações com sucesso", async () => {
    // Arrange
    const mockSolicitacoes = [
      {
        id: 1,
        descricao_peca: "Freio dianteiro",
        marca: "Volkswagen",
        modelo: "Golf",
      },
      {
        id: 2,
        descricao_peca: "Parabrisa",
        marca: "Ford",
        modelo: "Fiesta",
      },
    ];

    const mockResponse = {
      data: {
        success: true,
        data: {
          solicitacoes: mockSolicitacoes,
        },
      },
    };

    api.get.mockResolvedValue(mockResponse);

    // Act
    const { result } = renderHook(() => useSolicitacoes());

    // Assert
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.solicitacoes).toEqual(mockSolicitacoes);
    expect(result.current.error).toBeNull();
    expect(api.get).toHaveBeenCalledWith("/solicitacoes");
  });

  it("deve tratar erro ao carregar solicitações", async () => {
    // Arrange
    const mockError = {
      response: {
        data: {
          message: "Erro ao carregar solicitações",
        },
      },
    };

    api.get.mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useSolicitacoes());

    // Assert
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.solicitacoes).toEqual([]);
    expect(result.current.error).toBe("Erro ao carregar solicitações");
  });

  it("deve tratar erro sem response", async () => {
    // Arrange
    const mockError = new Error("Network error");

    api.get.mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useSolicitacoes());

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.solicitacoes).toEqual([]);
    expect(result.current.error).toBe("Erro ao carregar solicitações");
  });

  it("deve retornar array vazio quando não há solicitações", async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        data: {
          solicitacoes: [],
        },
      },
    };

    api.get.mockResolvedValue(mockResponse);

    // Act
    const { result } = renderHook(() => useSolicitacoes());

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.solicitacoes).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("deve ter função refetch que recarrega as solicitações", async () => {
    // Arrange
    const mockSolicitacoes = [
      {
        id: 1,
        descricao_peca: "Freio dianteiro",
      },
    ];

    const mockResponse = {
      data: {
        success: true,
        data: {
          solicitacoes: mockSolicitacoes,
        },
      },
    };

    api.get.mockResolvedValue(mockResponse);

    // Act
    const { result } = renderHook(() => useSolicitacoes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refetch
    const updatedSolicitacoes = [
      ...mockSolicitacoes,
      {
        id: 2,
        descricao_peca: "Parabrisa",
      },
    ];

    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          solicitacoes: updatedSolicitacoes,
        },
      },
    });

    await result.current.refetch();

    // Assert
    await waitFor(() => {
      expect(result.current.solicitacoes).toEqual(updatedSolicitacoes);
    });

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
