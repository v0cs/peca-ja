import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PasswordForm from "../PasswordForm";

// Helper para obter inputs de forma não ambígua
const getPasswordInputs = (container) => ({
  senhaAtual: container.querySelector('#senha_atual'),
  novaSenha: container.querySelector('#nova_senha'),
  confirmarSenha: container.querySelector('#confirmar_senha'),
});

describe("PasswordForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar todos os campos do formulário", () => {
    const { container } = render(<PasswordForm {...defaultProps} />);
    const { senhaAtual, novaSenha, confirmarSenha } = getPasswordInputs(container);
    
    expect(senhaAtual).toBeInTheDocument();
    expect(novaSenha).toBeInTheDocument();
    expect(confirmarSenha).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Alterar senha/i })).toBeInTheDocument();
  });

  it("deve exibir mensagem de segurança", () => {
    render(<PasswordForm {...defaultProps} />);
    
    expect(
      screen.getByText(/Por segurança, você será desconectado após alterar a senha/i)
    ).toBeInTheDocument();
  });

  it("deve permitir preencher os campos", () => {
    const { container } = render(<PasswordForm {...defaultProps} />);
    const { senhaAtual, novaSenha, confirmarSenha } = getPasswordInputs(container);

    fireEvent.change(senhaAtual, { target: { value: "senha123" } });
    fireEvent.change(novaSenha, { target: { value: "novaSenha456" } });
    fireEvent.change(confirmarSenha, { target: { value: "novaSenha456" } });

    expect(senhaAtual).toHaveValue("senha123");
    expect(novaSenha).toHaveValue("novaSenha456");
    expect(confirmarSenha).toHaveValue("novaSenha456");
  });

  it("deve exibir erro quando senha atual não é fornecida", async () => {
    render(<PasswordForm {...defaultProps} />);
    
    const form = screen.getByRole("button", { name: /Alterar senha/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Informe sua senha atual")).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando nova senha não é fornecida", async () => {
    render(<PasswordForm {...defaultProps} />);
    
    const senhaAtual = screen.getByLabelText(/Senha atual/i);
    fireEvent.change(senhaAtual, { target: { value: "senha123" } });

    const form = screen.getByRole("button", { name: /Alterar senha/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Digite a nova senha")).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando nova senha tem menos de 6 caracteres", async () => {
    const { container } = render(<PasswordForm {...defaultProps} />);
    const { senhaAtual, novaSenha } = getPasswordInputs(container);

    fireEvent.change(senhaAtual, { target: { value: "senha123" } });
    fireEvent.change(novaSenha, { target: { value: "12345" } });

    const form = screen.getByRole("button", { name: /Alterar senha/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText("A nova senha deve ter pelo menos 6 caracteres")
      ).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando senhas não coincidem", async () => {
    const { container } = render(<PasswordForm {...defaultProps} />);
    const { senhaAtual, novaSenha, confirmarSenha } = getPasswordInputs(container);

    fireEvent.change(senhaAtual, { target: { value: "senha123" } });
    fireEvent.change(novaSenha, { target: { value: "novaSenha456" } });
    fireEvent.change(confirmarSenha, { target: { value: "diferente" } });

    const form = screen.getByRole("button", { name: /Alterar senha/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
    });
  });

  it("deve chamar onSubmit com dados corretos quando formulário é válido", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });
    const { container } = render(<PasswordForm onSubmit={onSubmit} />);
    const { senhaAtual, novaSenha, confirmarSenha } = getPasswordInputs(container);

    fireEvent.change(senhaAtual, { target: { value: "senha123" } });
    fireEvent.change(novaSenha, { target: { value: "novaSenha456" } });
    fireEvent.change(confirmarSenha, { target: { value: "novaSenha456" } });

    const form = screen.getByRole("button", { name: /Alterar senha/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        senha_atual: "senha123",
        nova_senha: "novaSenha456",
        confirmar_senha: "novaSenha456",
      });
    });
  });

  it("deve exibir mensagem de sucesso quando onSubmit retorna success", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      success: true,
      message: "Senha alterada com sucesso",
    });
    const { container } = render(<PasswordForm onSubmit={onSubmit} />);
    const { senhaAtual, novaSenha, confirmarSenha } = getPasswordInputs(container);

    fireEvent.change(senhaAtual, { target: { value: "senha123" } });
    fireEvent.change(novaSenha, { target: { value: "novaSenha456" } });
    fireEvent.change(confirmarSenha, { target: { value: "novaSenha456" } });

    const form = screen.getByRole("button", { name: /Alterar senha/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Senha alterada com sucesso")).toBeInTheDocument();
    });
  });

  it("deve exibir mensagem de erro quando onSubmit retorna erro", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      success: false,
      message: "Senha atual incorreta",
    });
    const { container } = render(<PasswordForm onSubmit={onSubmit} />);
    const { senhaAtual, novaSenha, confirmarSenha } = getPasswordInputs(container);

    fireEvent.change(senhaAtual, { target: { value: "senha123" } });
    fireEvent.change(novaSenha, { target: { value: "novaSenha456" } });
    fireEvent.change(confirmarSenha, { target: { value: "novaSenha456" } });

    const form = screen.getByRole("button", { name: /Alterar senha/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Senha atual incorreta")).toBeInTheDocument();
    });
  });

  it("deve exibir 'Salvando...' quando loading é true", () => {
    render(<PasswordForm {...defaultProps} loading={true} />);
    
    expect(screen.getByText("Salvando...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("deve desabilitar campos quando loading é true", () => {
    const { container } = render(<PasswordForm {...defaultProps} loading={true} />);
    const { senhaAtual, novaSenha, confirmarSenha } = getPasswordInputs(container);

    expect(senhaAtual).toBeDisabled();
    expect(novaSenha).toBeDisabled();
    expect(confirmarSenha).toBeDisabled();
  });

  it("deve limpar erros ao digitar nos campos", async () => {
    render(<PasswordForm {...defaultProps} />);
    
    const form = screen.getByRole("button", { name: /Alterar senha/i }).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Informe sua senha atual")).toBeInTheDocument();
    });

    const senhaAtual = screen.getByLabelText(/Senha atual/i);
    fireEvent.change(senhaAtual, { target: { value: "senha123" } });

    await waitFor(() => {
      expect(screen.queryByText("Informe sua senha atual")).not.toBeInTheDocument();
    });
  });
});

