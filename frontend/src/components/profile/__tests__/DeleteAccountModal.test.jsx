import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import DeleteAccountModal from "../DeleteAccountModal";

describe("DeleteAccountModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não deve renderizar quando isOpen é false", () => {
    render(<DeleteAccountModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("heading", { name: "Excluir conta" })).not.toBeInTheDocument();
  });

  it("deve renderizar quando isOpen é true", () => {
    render(<DeleteAccountModal {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Excluir conta" })).toBeInTheDocument();
  });

  it("deve exibir título e descrição", () => {
    render(<DeleteAccountModal {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Excluir conta" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Esta ação é irreversível. Leia com atenção antes de continuar."
      )
    ).toBeInTheDocument();
  });

  it("deve exibir lista de consequências", () => {
    render(<DeleteAccountModal {...defaultProps} />);
    expect(
      screen.getByText("Todas as solicitações serão canceladas imediatamente.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Seus dados serão removidos permanentemente.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Você perderá acesso a todos os recursos da plataforma.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Esta ação não pode ser desfeita.")
    ).toBeInTheDocument();
  });

  it("deve exibir campo de confirmação", () => {
    render(<DeleteAccountModal {...defaultProps} />);
    expect(
      screen.getByLabelText(/Confirmação/i)
    ).toBeInTheDocument();
  });

  it("deve exibir campo de senha para contas não OAuth", () => {
    render(<DeleteAccountModal {...defaultProps} isOAuthAccount={false} />);
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
  });

  it("não deve exibir campo de senha para contas OAuth", () => {
    render(<DeleteAccountModal {...defaultProps} isOAuthAccount={true} />);
    expect(screen.queryByLabelText(/Senha/i)).not.toBeInTheDocument();
  });

  it("deve exibir mensagem para contas OAuth", () => {
    render(<DeleteAccountModal {...defaultProps} isOAuthAccount={true} />);
    expect(
      screen.getByText(/Conta vinculada ao Google/i)
    ).toBeInTheDocument();
  });

  it("deve chamar onClose ao clicar em Cancelar", () => {
    const onClose = vi.fn();
    render(<DeleteAccountModal {...defaultProps} onClose={onClose} />);
    const cancelButton = screen.getByText("Cancelar");
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });


  it("deve exibir erro quando senha não é fornecida (conta não OAuth)", async () => {
    render(<DeleteAccountModal {...defaultProps} isOAuthAccount={false} />);
    const confirmInput = screen.getByLabelText(/Confirmação/i);
    const form = confirmInput.closest("form");

    fireEvent.change(confirmInput, { target: { value: "CONFIRMAR" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText("Informe sua senha para continuar.")
      ).toBeInTheDocument();
    });
  });

  it("deve chamar onConfirm com dados corretos para conta não OAuth", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ success: true });
    render(
      <DeleteAccountModal
        {...defaultProps}
        onConfirm={onConfirm}
        isOAuthAccount={false}
      />
    );

    const confirmInput = screen.getByLabelText(/Confirmação/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole("button", { name: "Excluir conta" });

    fireEvent.change(confirmInput, { target: { value: "CONFIRMAR" } });
    fireEvent.change(passwordInput, { target: { value: "senha123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        confirmacao: "CONFIRMAR",
        senha: "senha123",
      });
    });
  });

  it("deve chamar onConfirm sem senha para conta OAuth", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ success: true });
    render(
      <DeleteAccountModal
        {...defaultProps}
        onConfirm={onConfirm}
        isOAuthAccount={true}
      />
    );

    const confirmInput = screen.getByLabelText(/Confirmação/i);
    const submitButton = screen.getByRole("button", { name: "Excluir conta" });

    fireEvent.change(confirmInput, { target: { value: "CONFIRMAR" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        confirmacao: "CONFIRMAR",
        senha: undefined,
      });
    });
  });

  it("deve desabilitar botões quando loading é true", () => {
    render(<DeleteAccountModal {...defaultProps} loading={true} />);
    const cancelButton = screen.getByText("Cancelar");
    const submitButton = screen.getByText("Excluindo...");
    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("deve exibir 'Excluindo...' quando loading é true", () => {
    render(<DeleteAccountModal {...defaultProps} loading={true} />);
    expect(screen.getByText("Excluindo...")).toBeInTheDocument();
  });

  it("deve limpar campos ao fechar modal", async () => {
    const { rerender } = render(
      <DeleteAccountModal {...defaultProps} isOpen={true} />
    );

    const confirmInput = screen.getByLabelText(/Confirmação/i);
    fireEvent.change(confirmInput, { target: { value: "CONFIRMAR" } });

    rerender(<DeleteAccountModal {...defaultProps} isOpen={false} />);
    rerender(<DeleteAccountModal {...defaultProps} isOpen={true} />);

    await waitFor(() => {
      const newConfirmInput = screen.getByLabelText(/Confirmação/i);
      expect(newConfirmInput.value).toBe("");
    });
  });

  it("deve exibir erro quando onConfirm retorna mensagem de erro", async () => {
    const onConfirm = vi.fn().mockResolvedValue({
      success: false,
      message: "Senha incorreta",
    });
    render(
      <DeleteAccountModal
        {...defaultProps}
        onConfirm={onConfirm}
        isOAuthAccount={false}
      />
    );

    const confirmInput = screen.getByLabelText(/Confirmação/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole("button", { name: "Excluir conta" });

    fireEvent.change(confirmInput, { target: { value: "CONFIRMAR" } });
    fireEvent.change(passwordInput, { target: { value: "senha123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Senha incorreta")).toBeInTheDocument();
    });
  });
});

