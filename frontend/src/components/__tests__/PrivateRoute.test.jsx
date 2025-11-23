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

const TestWrapper = ({ children, token = null, user = null }) => {
  // Mock do localStorage
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

describe("PrivateRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar children quando autenticado", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <PrivateRoute>
          <div>Conteúdo protegido</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
    });
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
      <TestWrapper token="test-token" user={mockUser}>
        <PrivateRoute tipoUsuario="cliente">
          <div>Conteúdo do cliente</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Conteúdo do cliente")).toBeInTheDocument();
    });
  });

  it("deve redirecionar quando tipo de usuário não corresponde", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <PrivateRoute tipoUsuario="autopeca">
          <div>Conteúdo da autopeça</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      const navigate = screen.getByTestId("navigate");
      expect(navigate).toHaveAttribute("data-to", "/dashboard/cliente");
    });
  });

  it("deve permitir acesso quando tipo está no array de tipos permitidos", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      tipo_usuario: "cliente",
    };

    render(
      <TestWrapper token="test-token" user={mockUser}>
        <PrivateRoute tipoUsuario={["cliente", "autopeca"]}>
          <div>Conteúdo permitido</div>
        </PrivateRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Conteúdo permitido")).toBeInTheDocument();
    });
  });
});

