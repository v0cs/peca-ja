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

// Mock do api service
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
vi.mock("../../../services/api", () => {
  return {
    default: {
      get: (...args) => mockApiGet(...args),
      post: (...args) => mockApiPost(...args),
    },
  };
});

const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockClear();
    mockApiPost.mockClear();

    // Mock logout para sempre retornar sucesso
    mockApiPost.mockResolvedValue({
      data: {
        success: true,
      },
    });
  });

  it("deve renderizar o logo e nome da aplicação", async () => {
    // Mock não autenticado
    mockApiGet.mockRejectedValueOnce({
      response: {
        status: 401,
      },
    });

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
    // Mock não autenticado
    mockApiGet.mockRejectedValueOnce({
      response: {
        status: 401,
      },
    });

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

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: mockUser.cliente,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("João Cliente")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve exibir botão Dashboard quando autenticado", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve exibir botão Meu Perfil para cliente", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve exibir botão Minha Conta para autopeca", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "autopeca",
    };

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Minha Conta")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve exibir botão Nova Solicitação para cliente", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Nova Solicitação")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve exibir botão Vendedores para autopeca", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "autopeca",
    };

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Vendedores")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve exibir botão Sair quando autenticado", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Sair")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve chamar logout e navegar para home ao clicar em Sair", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Sair")).toBeInTheDocument();
    });

    const sairButton = screen.getByText("Sair");
    fireEvent.click(sairButton);

    // Aguardar um pouco para o logout ser processado
    await waitFor(
      () => {
        expect(mockApiPost).toHaveBeenCalledWith("/auth/logout");
        expect(mockNavigate).toHaveBeenCalledWith("/");
      },
      { timeout: 3000 }
    );
  });

  it("deve usar email como fallback quando nome não está disponível", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
      cliente: null,
    };

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: null,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
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

    // Mock autenticado
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: mockUser.id,
            email: mockUser.email,
            tipo_usuario: mockUser.tipo_usuario,
            ativo: true,
          },
          cliente: null,
          autopeca: mockUser.autopeca,
          vendedor: null,
        },
      },
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Auto Peças LTDA")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
