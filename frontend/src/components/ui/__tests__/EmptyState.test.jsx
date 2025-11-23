import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  it("deve renderizar título e mensagem", () => {
    render(
      <EmptyState
        title="Nenhum item encontrado"
        message="Não há itens para exibir"
      />
    );

    expect(screen.getByText("Nenhum item encontrado")).toBeInTheDocument();
    expect(screen.getByText("Não há itens para exibir")).toBeInTheDocument();
  });

  it("deve renderizar ícone quando fornecido", () => {
    const icon = <span data-testid="icon">📦</span>;
    render(
      <EmptyState
        title="Vazio"
        message="Mensagem"
        icon={icon}
      />
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("deve renderizar botão de ação quando onAction e actionLabel são fornecidos", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="Vazio"
        message="Mensagem"
        actionLabel="Criar novo"
        onAction={handleAction}
      />
    );

    const button = screen.getByRole("button", { name: /criar novo/i });
    expect(button).toBeInTheDocument();
  });

  it("não deve renderizar botão quando onAction não é fornecido", () => {
    render(
      <EmptyState
        title="Vazio"
        message="Mensagem"
        actionLabel="Criar novo"
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("não deve renderizar botão quando actionLabel não é fornecido", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="Vazio"
        message="Mensagem"
        onAction={handleAction}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("deve chamar onAction quando botão é clicado", () => {
    const handleAction = vi.fn();
    
    render(
      <EmptyState
        title="Vazio"
        message="Mensagem"
        actionLabel="Ação"
        onAction={handleAction}
      />
    );

    const button = screen.getByRole("button", { name: /ação/i });
    fireEvent.click(button);

    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});

