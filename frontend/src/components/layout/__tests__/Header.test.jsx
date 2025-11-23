import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Header from "../Header";
import { AuthProvider } from "../../../contexts/AuthContext";

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const TestWrapper = ({ children, token = null, user = null }) => {
  const mockLocalStorage = {
    getItem: vi.fn((key) => {
      if (key === "token") return token;
      if (key === "user") return user ? JSON.stringify(user) : null;
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });

  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o logo e nome da aplicação", async () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("PeçaJá")).toBeInTheDocument();
    });
  });

  it("deve exibir botões Login e Cadastrar quando não autenticado", async () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByText("Cadastrar")).toBeInTheDocument();
    });
  });

  it("deve exibir nome do usuário quando autenticado como cliente", async () => {
    const mockUser = {
      id: 1,
      email: "cliente@example.com",
      tipo_usuario: "cliente",
      cliente: {
        nome_completo: "João Cliente",
      },
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("João Cliente")).toBeInTheDocument();
    });
  });

  it("deve exibir botão Dashboard quando autenticado", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  it("deve exibir botão Meu Perfil para cliente", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
    });
  });

  it("deve exibir botão Minha Conta para autopeca", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "autopeca",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Minha Conta")).toBeInTheDocument();
    });
  });

  it("deve exibir botão Nova Solicitação para cliente", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Nova Solicitação")).toBeInTheDocument();
    });
  });

  it("deve exibir botão Vendedores para autopeca", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "autopeca",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Vendedores")).toBeInTheDocument();
    });
  });

  it("deve exibir botão Sair quando autenticado", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Sair")).toBeInTheDocument();
    });
  });

  it("deve chamar logout e navegar para home ao clicar em Sair", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      const sairButton = screen.getByText("Sair");
      fireEvent.click(sairButton);
    });

    // Aguardar um pouco para o logout ser processado
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    }, { timeout: 2000 });
  });

  it("deve usar email como fallback quando nome não está disponível", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
      cliente: null,
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  it("deve exibir razao_social para autopeca quando disponível", async () => {
    const mockUser = {
      id: 1,
      email: "autopeca@example.com",
      tipo_usuario: "autopeca",
      autopeca: {
        razao_social: "Auto Peças LTDA",
      },
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Auto Peças LTDA")).toBeInTheDocument();
    });
  });
});

