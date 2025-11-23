import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmModal from "../ConfirmModal";

describe("ConfirmModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não deve renderizar quando isOpen é false", () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Confirmar ação")).not.toBeInTheDocument();
  });

  it("deve renderizar quando isOpen é true", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Confirmar ação")).toBeInTheDocument();
  });

  it("deve exibir o título padrão", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Confirmar ação")).toBeInTheDocument();
  });

  it("deve exibir o título customizado", () => {
    render(<ConfirmModal {...defaultProps} title="Excluir item" />);
    expect(screen.getByText("Excluir item")).toBeInTheDocument();
  });

  it("deve exibir a mensagem padrão", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(
      screen.getByText("Tem certeza que deseja realizar esta ação?")
    ).toBeInTheDocument();
  });

  it("deve exibir a mensagem customizada", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        message="Esta ação não pode ser desfeita"
      />
    );
    expect(
      screen.getByText("Esta ação não pode ser desfeita")
    ).toBeInTheDocument();
  });

  it("deve chamar onClose quando clicar no botão de fechar", () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("deve chamar onClose quando clicar no botão cancelar", () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    const cancelButton = screen.getByText("Cancelar");
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("deve chamar onConfirm quando clicar no botão confirmar", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    const confirmButton = screen.getByText("Confirmar");
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("deve exibir texto customizado nos botões", () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="Excluir"
        cancelText="Manter"
      />
    );
    expect(screen.getByText("Excluir")).toBeInTheDocument();
    expect(screen.getByText("Manter")).toBeInTheDocument();
  });

  it("deve desabilitar botões quando loading é true", () => {
    render(<ConfirmModal {...defaultProps} loading={true} />);
    const confirmButton = screen.getByText("Processando...");
    const cancelButton = screen.getByText("Cancelar");
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("deve exibir 'Processando...' quando loading é true", () => {
    render(<ConfirmModal {...defaultProps} loading={true} />);
    expect(screen.getByText("Processando...")).toBeInTheDocument();
  });

  it("deve usar variante destructive por padrão", () => {
    const { container } = render(<ConfirmModal {...defaultProps} />);
    const iconContainer = container.querySelector(".bg-red-100");
    expect(iconContainer).toBeInTheDocument();
  });

  it("deve usar variante default quando especificada", () => {
    const { container } = render(
      <ConfirmModal {...defaultProps} variant="default" />
    );
    const iconContainer = container.querySelector(".bg-yellow-100");
    expect(iconContainer).toBeInTheDocument();
  });
});

