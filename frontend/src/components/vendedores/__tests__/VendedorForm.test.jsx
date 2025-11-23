import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VendedorForm from "../VendedorForm";

describe("VendedorForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar formulário de cadastro quando vendedor não é fornecido", () => {
    render(<VendedorForm {...defaultProps} />);
    
    expect(screen.getByText("Cadastrar Novo Vendedor")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadastrar Vendedor/i })).toBeInTheDocument();
  });

  it("deve renderizar formulário de edição quando vendedor é fornecido", () => {
    const vendedor = {
      nome_completo: "João Silva",
      usuario: {
        email: "joao@exemplo.com",
      },
    };

    render(<VendedorForm {...defaultProps} vendedor={vendedor} />);
    
    expect(screen.getByText("Editar Vendedor")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByText("joao@exemplo.com")).toBeInTheDocument();
    expect(screen.getByText(/O email não pode ser alterado/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar Alterações/i })).toBeInTheDocument();
  });

  it("deve preencher campos automaticamente em modo de edição", async () => {
    const vendedor = {
      nome_completo: "João Silva",
      usuario: {
        email: "joao@exemplo.com",
      },
    };

    render(<VendedorForm {...defaultProps} vendedor={vendedor} />);
    
    await waitFor(() => {
      const nomeInput = screen.getByLabelText(/Nome Completo/i);
      expect(nomeInput).toHaveValue("João Silva");
    });
  });

  it("deve exibir mensagem sobre senha automática em modo de cadastro", () => {
    render(<VendedorForm {...defaultProps} />);
    
    expect(
      screen.getByText(/Senha automática:/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Uma senha temporária será gerada/i)
    ).toBeInTheDocument();
  });

  it("não deve exibir mensagem sobre senha automática em modo de edição", () => {
    const vendedor = {
      nome_completo: "João Silva",
      usuario: {
        email: "joao@exemplo.com",
      },
    };

    render(<VendedorForm {...defaultProps} vendedor={vendedor} />);
    
    expect(
      screen.queryByText(/Senha automática:/i)
    ).not.toBeInTheDocument();
  });

  it("deve permitir preencher campos do formulário", () => {
    render(<VendedorForm {...defaultProps} />);
    
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(nomeInput, { target: { value: "Maria Santos" } });
    fireEvent.change(emailInput, { target: { value: "maria@exemplo.com" } });

    expect(nomeInput).toHaveValue("Maria Santos");
    expect(emailInput).toHaveValue("maria@exemplo.com");
  });

  it("deve chamar onCancel ao clicar no botão Cancelar", () => {
    const onCancel = vi.fn();
    render(<VendedorForm {...defaultProps} onCancel={onCancel} />);
    
    const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("deve chamar onCancel ao clicar no botão X", () => {
    const onCancel = vi.fn();
    render(<VendedorForm {...defaultProps} onCancel={onCancel} />);
    
    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("deve exibir erro quando nome não é fornecido", async () => {
    render(<VendedorForm {...defaultProps} />);
    
    const form = screen.getByRole("button", { name: /Cadastrar Vendedor/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Nome completo é obrigatório")).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando nome tem menos de 2 caracteres", async () => {
    render(<VendedorForm {...defaultProps} />);
    
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    fireEvent.change(nomeInput, { target: { value: "A" } });

    const form = screen.getByRole("button", { name: /Cadastrar Vendedor/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Nome deve ter pelo menos 2 caracteres")).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando email não é fornecido em modo de cadastro", async () => {
    render(<VendedorForm {...defaultProps} />);
    
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    fireEvent.change(nomeInput, { target: { value: "João Silva" } });

    const form = screen.getByRole("button", { name: /Cadastrar Vendedor/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando email é inválido", async () => {
    render(<VendedorForm {...defaultProps} />);
    
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(nomeInput, { target: { value: "João Silva" } });
    fireEvent.change(emailInput, { target: { value: "email-invalido" } });

    const form = screen.getByRole("button", { name: /Cadastrar Vendedor/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Email inválido")).toBeInTheDocument();
    });
  });

  it("deve chamar onSubmit com dados corretos em modo de cadastro", async () => {
    const onSubmit = vi.fn();
    render(<VendedorForm {...defaultProps} onSubmit={onSubmit} />);
    
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(nomeInput, { target: { value: "João Silva" } });
    fireEvent.change(emailInput, { target: { value: "joao@exemplo.com" } });

    const form = screen.getByRole("button", { name: /Cadastrar Vendedor/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nome: "João Silva",
        email: "joao@exemplo.com",
      });
    });
  });

  it("deve chamar onSubmit com dados corretos em modo de edição", async () => {
    const onSubmit = vi.fn();
    const vendedor = {
      nome_completo: "João Silva",
      usuario: {
        email: "joao@exemplo.com",
      },
    };

    render(<VendedorForm {...defaultProps} onSubmit={onSubmit} vendedor={vendedor} />);
    
    await waitFor(() => {
      const nomeInput = screen.getByLabelText(/Nome Completo/i);
      expect(nomeInput).toHaveValue("João Silva");
    });

    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    fireEvent.change(nomeInput, { target: { value: "João Silva Santos" } });

    const form = screen.getByRole("button", { name: /Salvar Alterações/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        nome_completo: "João Silva Santos",
      });
    });
  });

  it("deve exibir 'Salvando...' quando loading é true", () => {
    render(<VendedorForm {...defaultProps} loading={true} />);
    
    expect(screen.getByText("Salvando...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvando.../i })).toBeDisabled();
  });

  it("deve desabilitar campos quando loading é true", () => {
    render(<VendedorForm {...defaultProps} loading={true} />);
    
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    expect(nomeInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
  });

  it("deve limpar erros ao digitar nos campos", async () => {
    render(<VendedorForm {...defaultProps} />);
    
    const form = screen.getByRole("button", { name: /Cadastrar Vendedor/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Nome completo é obrigatório")).toBeInTheDocument();
    });

    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    fireEvent.change(nomeInput, { target: { value: "João" } });

    await waitFor(() => {
      expect(screen.queryByText("Nome completo é obrigatório")).not.toBeInTheDocument();
    });
  });
});

