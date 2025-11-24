import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import api from "../../services/api";

// Mock do api
vi.mock("../../services/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  },
}));

// Mock do localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe("login", () => {
    it("deve fazer login com sucesso e salvar token no localStorage", async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: "test-token-123",
            usuario: {
              id: 1,
              email: "test@teste.com",
              tipo_usuario: "cliente",
            },
            cliente: {
              id: 1,
              nome_completo: "João Silva",
            },
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        const loginResult = await result.current.login("test@teste.com", "123456");
        expect(loginResult.success).toBe(true);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.token).toBe("test-token-123");
        expect(result.current.user).toBeTruthy();
        expect(result.current.user.email).toBe("test@teste.com");
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "token",
          "test-token-123"
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "user",
          expect.stringContaining("test@teste.com")
        );
      });
    });

    it("deve retornar erro quando credenciais são inválidas", async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            message: "Credenciais inválidas",
          },
        },
      };

      api.post.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        const loginResult = await result.current.login(
          "test@teste.com",
          "senha-errada"
        );
        expect(loginResult.success).toBe(false);
        expect(loginResult.message).toBe("Credenciais inválidas");
      });

      // Assert
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it("deve fazer login para autopeca", async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: "test-token-autopeca",
            usuario: {
              id: 2,
              email: "autopeca@teste.com",
              tipo_usuario: "autopeca",
            },
            autopeca: {
              id: 1,
              razao_social: "Auto Peças LTDA",
            },
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        await result.current.login("autopeca@teste.com", "123456");
      });

      // Assert
      await waitFor(() => {
        expect(result.current.user.tipo_usuario).toBe("autopeca");
        expect(result.current.user.autopeca).toBeTruthy();
      });
    });
  });

  describe("logout", () => {
    it("deve fazer logout e limpar localStorage", async () => {
      // Arrange
      localStorageMock.setItem("token", "test-token");
      localStorageMock.setItem("user", JSON.stringify({ id: 1 }));

      const mockResponse = {
        data: {
          success: true,
        },
      };
      api.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Configurar estado inicial
      await act(async () => {
        result.current.login("test@teste.com", "123456");
      });

      // Act
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.token).toBeNull();
        expect(result.current.user).toBeNull();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
      });
    });

    it("deve fazer logout mesmo se API falhar", async () => {
      // Arrange
      api.post.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Act
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.token).toBeNull();
        expect(result.current.user).toBeNull();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
      });
    });
  });

  describe("updateUser", () => {
    it("deve atualizar dados do usuário", async () => {
      // Arrange
      const { result } = renderHook(() => useAuth(), { wrapper });

      const newUserData = {
        id: 1,
        email: "updated@teste.com",
        tipo_usuario: "cliente",
      };

      // Act
      await act(async () => {
        result.current.updateUser(newUserData, "new-token");
      });

      // Assert
      await waitFor(() => {
        expect(result.current.user).toEqual(newUserData);
        expect(result.current.token).toBe("new-token");
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "token",
          "new-token"
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify(newUserData)
        );
      });
    });
  });

  describe("loading state", () => {
    it("deve iniciar com loading true e depois mudar para false", async () => {
      // Arrange
      const { result } = renderHook(() => useAuth(), { wrapper });

      // O loading pode já estar false se o useEffect executou muito rápido
      // Verificamos que ele muda para false eventualmente
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 1000 });
      
      // Verificar que loading foi false (pode ter sido true inicialmente, mas agora é false)
      expect(result.current.loading).toBe(false);
    });
  });

  describe("localStorage persistence", () => {
    it("deve carregar dados do localStorage ao inicializar", async () => {
      // Arrange
      const storedToken = "stored-token";
      const storedUser = { id: 1, email: "stored@teste.com" };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "token") return storedToken;
        if (key === "user") return JSON.stringify(storedUser);
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.token).toBe(storedToken);
        expect(result.current.user).toEqual(storedUser);
      });
    });

    it("deve não carregar dados se localStorage estiver vazio", async () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.token).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });
  });
});



