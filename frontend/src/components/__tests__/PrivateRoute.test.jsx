import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PrivateRoute from "../PrivateRoute";
import { AuthProvider } from "../../contexts/AuthContext";

// Mock do Navigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  };
});

// Mock do api service
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
vi.mock("../../services/api", () => {
  return {
    default: {
      get: (...args) => mockApiGet(...args),
      post: (...args) => mockApiPost(...args),
    },
  };
});

const TestWrapper = ({ children, user = null }) => {
  // Se user fornecido, mockar /auth/me para retornar o usuário
  // Caso contrário, retornar erro (não autenticado)
  if (user) {
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          usuario: {
            id: user.id,
            email: user.email,
            tipo_usuario: user.tipo_usuario,
            ativo: user.ativo !== undefined ? user.ativo : true,
          },
          cliente: user.cliente || null,
          autopeca: user.autopeca || null,
          vendedor: user.vendedor || null,
        },
      },
    });
  } else {
    mockApiGet.mockRejectedValueOnce({
      response: {
        status: 401,
      },
    });
  }

  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

describe("PrivateRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockClear();
    mockApiPost.mockClear();
  });

  it("deve renderizar children quando autenticado", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper user={mockUser}>
        <PrivateRoute>
          <div>Conteúdo protegido</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve redirecionar para login quando não autenticado", async () => {
    render(
      <TestWrapper>
        <PrivateRoute>
          <div>Conteúdo protegido</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      const navigate = screen.getByTestId("navigate");
      expect(navigate).toHaveAttribute("data-to", "/login");
    });
  });

  it("deve permitir acesso quando tipo de usuário corresponde", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper user={mockUser}>
        <PrivateRoute tipoUsuario="cliente">
          <div>Conteúdo do cliente</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Conteúdo do cliente")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deve redirecionar quando tipo de usuário não corresponde", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper user={mockUser}>
        <PrivateRoute tipoUsuario="autopeca">
          <div>Conteúdo da autopeça</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(
      () => {
        const navigate = screen.getByTestId("navigate");
        expect(navigate).toHaveAttribute("data-to", "/dashboard/cliente");
      },
      { timeout: 3000 }
    );
  });

  it("deve permitir acesso quando tipo está no array de tipos permitidos", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper user={mockUser}>
        <PrivateRoute tipoUsuario={["cliente", "autopeca"]}>
          <div>Conteúdo permitido</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Conteúdo permitido")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
