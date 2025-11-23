import { render, screen, fireEvent } from "@testing-library/react";
import VendedorCard from "../VendedorCard";

describe("VendedorCard", () => {
  const mockVendedor = {
    id: 1,
    nome_completo: "João Silva",
    ativo: true,
    created_at: "2024-01-15T10:00:00Z",
    usuario: {
      email: "joao@example.com",
    },
  };

  const defaultProps = {
    vendedor: mockVendedor,
    onEditar: vi.fn(),
    onInativar: vi.fn(),
    onReativar: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o nome do vendedor", () => {
    render(<VendedorCard {...defaultProps} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("deve renderizar o email do vendedor", () => {
    render(<VendedorCard {...defaultProps} />);
    expect(screen.getByText("joao@example.com")).toBeInTheDocument();
  });

  it("deve renderizar a data de cadastro formatada", () => {
    render(<VendedorCard {...defaultProps} />);
    expect(screen.getByText(/Cadastrado em/)).toBeInTheDocument();
    expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
  });

  it("deve exibir 'Email não disponível' quando email não existe", () => {
    const vendedorSemEmail = {
      ...mockVendedor,
      usuario: null,
    };
    render(<VendedorCard {...defaultProps} vendedor={vendedorSemEmail} />);
    expect(screen.getByText("Email não disponível")).toBeInTheDocument();
  });

  it("deve exibir StatusBadge com status ativo", () => {
    render(<VendedorCard {...defaultProps} />);
    // StatusBadge renderiza "Ativo" quando ativo é true
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("deve exibir StatusBadge com status inativo", () => {
    const vendedorInativo = {
      ...mockVendedor,
      ativo: false,
    };
    render(<VendedorCard {...defaultProps} vendedor={vendedorInativo} />);
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("deve abrir menu ao clicar no botão de menu", () => {
    render(<VendedorCard {...defaultProps} />);
    const menuButtons = screen.getAllByRole("button");
    // O botão de menu é o último (MoreVertical)
    const menuButton = menuButtons[menuButtons.length - 1];
    fireEvent.click(menuButton);
    expect(screen.getByText("Editar")).toBeInTheDocument();
  });

  it("deve chamar onEditar ao clicar em Editar", () => {
    const onEditar = vi.fn();
    render(<VendedorCard {...defaultProps} onEditar={onEditar} />);
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons[menuButtons.length - 1];
    fireEvent.click(menuButton);
    const editarButton = screen.getByText("Editar");
    fireEvent.click(editarButton);
    expect(onEditar).toHaveBeenCalledWith(mockVendedor);
    expect(onEditar).toHaveBeenCalledTimes(1);
  });

  it("deve exibir botão Inativar quando vendedor está ativo", () => {
    render(<VendedorCard {...defaultProps} />);
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons[menuButtons.length - 1];
    fireEvent.click(menuButton);
    expect(screen.getByText("Inativar")).toBeInTheDocument();
  });

  it("deve chamar onInativar ao clicar em Inativar", () => {
    const onInativar = vi.fn();
    render(<VendedorCard {...defaultProps} onInativar={onInativar} />);
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons[menuButtons.length - 1];
    fireEvent.click(menuButton);
    const inativarButton = screen.getByText("Inativar");
    fireEvent.click(inativarButton);
    expect(onInativar).toHaveBeenCalledWith(mockVendedor);
    expect(onInativar).toHaveBeenCalledTimes(1);
  });

  it("deve exibir botão Reativar quando vendedor está inativo", () => {
    const vendedorInativo = {
      ...mockVendedor,
      ativo: false,
    };
    render(<VendedorCard {...defaultProps} vendedor={vendedorInativo} />);
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons[menuButtons.length - 1];
    fireEvent.click(menuButton);
    expect(screen.getByText("Reativar")).toBeInTheDocument();
  });

  it("deve chamar onReativar ao clicar em Reativar", () => {
    const onReativar = vi.fn();
    const vendedorInativo = {
      ...mockVendedor,
      ativo: false,
    };
    render(
      <VendedorCard
        {...defaultProps}
        vendedor={vendedorInativo}
        onReativar={onReativar}
      />
    );
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons[menuButtons.length - 1];
    fireEvent.click(menuButton);
    const reativarButton = screen.getByText("Reativar");
    fireEvent.click(reativarButton);
    expect(onReativar).toHaveBeenCalledWith(vendedorInativo);
    expect(onReativar).toHaveBeenCalledTimes(1);
  });

  it("deve fechar menu ao clicar fora dele", () => {
    render(<VendedorCard {...defaultProps} />);
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons[menuButtons.length - 1];
    fireEvent.click(menuButton);
    expect(screen.getByText("Editar")).toBeInTheDocument();

    // Clicar no overlay (fora do menu)
    const overlay = document.querySelector(".fixed.inset-0");
    if (overlay) {
      fireEvent.click(overlay);
      expect(screen.queryByText("Editar")).not.toBeInTheDocument();
    }
  });

  it("deve formatar data inválida corretamente", () => {
    const vendedorDataInvalida = {
      ...mockVendedor,
      created_at: "data-invalida",
    };
    render(<VendedorCard {...defaultProps} vendedor={vendedorDataInvalida} />);
    // Quando a data é inválida, toLocaleDateString retorna "Invalid Date"
    // O texto está dividido: "Cadastrado em" e "Invalid Date"
    // Verificar que o texto completo contém "Invalid Date"
    const elements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes("Invalid Date") || false;
    });
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });

  it("deve exibir 'Data não disponível' quando created_at é null", () => {
    const vendedorSemData = {
      ...mockVendedor,
      created_at: null,
    };
    render(<VendedorCard {...defaultProps} vendedor={vendedorSemData} />);
    // O texto está dividido: "Cadastrado em" e "Data não disponível"
    // Usar getAllByText porque há múltiplos elementos aninhados que contêm o texto
    const elements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes("Data não disponível") || false;
    });
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });
});

