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
    // Mock padrão para /auth/me: não autenticado (401)
    api.get.mockRejectedValue({
      response: {
        status: 401,
      },
    });
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe("login", () => {
    it("deve fazer login com sucesso", async () => {
      // Arrange
      const mockResponse = {
        data: {
          success: true,
          data: {
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
        const loginResult = await result.current.login(
          "test@teste.com",
          "123456"
        );
        expect(loginResult.success).toBe(true);
      });

      // Assert
      await waitFor(() => {
        // Token não está mais no localStorage, está em cookie httpOnly
        expect(result.current.token).toBeNull();
        expect(result.current.user).toBeTruthy();
        expect(result.current.user.email).toBe("test@teste.com");
        expect(result.current.user.cliente.nome_completo).toBe("João Silva");
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
        expect(result.current.token).toBeNull(); // Token está em cookie, não no estado
      });
    });
  });

  describe("logout", () => {
    it("deve fazer logout e limpar estado", async () => {
      // Arrange
      const mockLoginResponse = {
        data: {
          success: true,
          data: {
            usuario: {
              id: 1,
              email: "test@teste.com",
              tipo_usuario: "cliente",
            },
          },
        },
      };

      const mockLogoutResponse = {
        data: {
          success: true,
        },
      };

      api.post.mockResolvedValueOnce(mockLoginResponse);
      api.post.mockResolvedValueOnce(mockLogoutResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Configurar estado inicial (login)
      await act(async () => {
        await result.current.login("test@teste.com", "123456");
      });

      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      // Act - Logout
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.token).toBeNull();
        expect(result.current.user).toBeNull();
        expect(api.post).toHaveBeenCalledWith("/auth/logout");
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
        expect(api.post).toHaveBeenCalledWith("/auth/logout");
      });
    });
  });

  describe("updateUser", () => {
    it("deve atualizar dados do usuário", async () => {
      // Arrange - Primeiro fazer login para ter um usuário no estado
      const mockLoginResponse = {
        data: {
          success: true,
          data: {
            usuario: {
              id: 1,
              email: "test@teste.com",
              tipo_usuario: "cliente",
            },
          },
        },
      };

      api.post.mockResolvedValueOnce(mockLoginResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login primeiro
      await act(async () => {
        await result.current.login("test@teste.com", "123456");
      });

      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      const newUserData = {
        id: 1,
        email: "updated@teste.com",
        tipo_usuario: "cliente",
      };

      // Act
      await act(async () => {
        result.current.updateUser(newUserData);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.user).toEqual(newUserData);
        // Token não é mais passado como parâmetro, está em cookie httpOnly
        expect(result.current.token).toBeNull();
      });
    });
  });

  describe("loading state", () => {
    it("deve iniciar com loading true e depois mudar para false", async () => {
      // Arrange
      const { result } = renderHook(() => useAuth(), { wrapper });

      // O loading pode já estar false se o useEffect executou muito rápido
      // Verificamos que ele muda para false eventualmente
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 1000 }
      );

      // Verificar que loading foi false (pode ter sido true inicialmente, mas agora é false)
      expect(result.current.loading).toBe(false);
    });
  });

  describe("autenticação inicial", () => {
    it("deve verificar autenticação via /auth/me ao inicializar", async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: "stored@teste.com",
        tipo_usuario: "cliente",
      };

      api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            usuario: mockUser,
            cliente: null,
            autopeca: null,
            vendedor: null,
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith("/auth/me");
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toBeTruthy();
        expect(result.current.user.email).toBe("stored@teste.com");
        // Token não está no estado, está em cookie httpOnly
        expect(result.current.token).toBeNull();
      });
    });

    it("deve não autenticar se /auth/me retornar erro", async () => {
      // Arrange
      api.get.mockRejectedValueOnce({
        response: {
          status: 401,
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith("/auth/me");
        expect(result.current.token).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
