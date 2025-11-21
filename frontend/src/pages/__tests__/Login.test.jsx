import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Login from "../Login";
import { AuthProvider } from "../../contexts/AuthContext";
import api from "../../services/api";

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it("deve renderizar o formulário de login", () => {
    // Act
    renderWithProviders(<Login />);

    // Assert
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("deve permitir preencher email e senha", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const senhaInput = screen.getByLabelText(/senha/i);

    // Act
    await user.type(emailInput, "test@teste.com");
    await user.type(senhaInput, "123456");

    // Assert
    expect(emailInput).toHaveValue("test@teste.com");
    expect(senhaInput).toHaveValue("123456");
  });

  it("deve fazer login e redirecionar cliente para dashboard", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        success: true,
        data: {
          token: "test-token",
          usuario: {
            id: 1,
            email: "cliente@teste.com",
            tipo_usuario: "cliente",
          },
          cliente: {
            id: 1,
            nome_completo: "João Cliente",
          },
        },
      },
    };

    api.post.mockResolvedValue(mockResponse);
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const senhaInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole("button", { name: /entrar/i });

    // Act
    await user.type(emailInput, "cliente@teste.com");
    await user.type(senhaInput, "123456");
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "cliente@teste.com",
        senha: "123456",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/cliente");
    });
  });

  it("deve fazer login e redirecionar autopeca para dashboard", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        success: true,
        data: {
          token: "test-token",
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
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const senhaInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole("button", { name: /entrar/i });

    // Act
    await user.type(emailInput, "autopeca@teste.com");
    await user.type(senhaInput, "123456");
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/autopeca");
    });
  });

  it("deve exibir erro quando login falha", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockError = {
      response: {
        data: {
          success: false,
          message: "Credenciais inválidas",
        },
      },
    };

    api.post.mockRejectedValue(mockError);
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const senhaInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole("button", { name: /entrar/i });

    // Act
    await user.type(emailInput, "test@teste.com");
    await user.type(senhaInput, "senha-errada");
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });

  it("deve desabilitar botão durante loading", async () => {
    // Arrange
    const user = userEvent.setup();
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    api.post.mockReturnValue(loginPromise);
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const senhaInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole("button", { name: /entrar/i });

    // Act
    await user.type(emailInput, "test@teste.com");
    await user.type(senhaInput, "123456");
    await user.click(submitButton);

    // Assert - Botão deve estar desabilitado durante loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Resolver promise
    resolveLogin({
      data: {
        success: true,
        data: {
          token: "test-token",
          usuario: { id: 1, tipo_usuario: "cliente" },
        },
      },
    });

    // Botão deve estar habilitado novamente após loading
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("deve ter link para página de registro", () => {
    // Act
    renderWithProviders(<Login />);

    // Assert
    const registroLink = screen.getByRole("link", { name: /criar nova conta/i });
    expect(registroLink).toBeInTheDocument();
    expect(registroLink).toHaveAttribute("href", "/cadastrar");
  });
});

