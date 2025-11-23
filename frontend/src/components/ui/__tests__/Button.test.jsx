import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../Button";

describe("Button", () => {
  it("deve renderizar com variante padrão", () => {
    render(<Button>Clique aqui</Button>);
    const button = screen.getByRole("button", { name: /clique aqui/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
  });

  it("deve renderizar com variante destructive", () => {
    render(<Button variant="destructive">Excluir</Button>);
    const button = screen.getByRole("button", { name: /excluir/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-destructive");
  });

  it("deve renderizar com variante outline", () => {
    render(<Button variant="outline">Cancelar</Button>);
    const button = screen.getByRole("button", { name: /cancelar/i });
    expect(button).toBeInTheDocument();
  });

  it("deve renderizar com variante secondary", () => {
    render(<Button variant="secondary">Secundário</Button>);
    const button = screen.getByRole("button", { name: /secundário/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-secondary");
  });

  it("deve renderizar com variante ghost", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button", { name: /ghost/i });
    expect(button).toBeInTheDocument();
  });

  it("deve renderizar com variante link", () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole("button", { name: /link/i });
    expect(button).toBeInTheDocument();
  });

  it("deve renderizar com tamanho sm", () => {
    render(<Button size="sm">Pequeno</Button>);
    const button = screen.getByRole("button", { name: /pequeno/i });
    expect(button).toHaveClass("h-9");
  });

  it("deve renderizar com tamanho lg", () => {
    render(<Button size="lg">Grande</Button>);
    const button = screen.getByRole("button", { name: /grande/i });
    expect(button).toHaveClass("h-11");
  });

  it("deve renderizar com tamanho icon", () => {
    render(<Button size="icon">🔍</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-10", "w-10");
  });

  it("deve chamar onClick quando clicado", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clique</Button>);
    
    const button = screen.getByRole("button", { name: /clique/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("deve estar desabilitado quando disabled é true", () => {
    render(<Button disabled>Desabilitado</Button>);
    const button = screen.getByRole("button", { name: /desabilitado/i });
    expect(button).toBeDisabled();
  });

  it("deve aceitar className customizada", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button", { name: /custom/i });
    expect(button).toHaveClass("custom-class");
  });

  it("deve passar props adicionais para o elemento", () => {
    render(<Button data-testid="button-test" type="submit">Submit</Button>);
    const button = screen.getByTestId("button-test");
    expect(button).toHaveAttribute("type", "submit");
  });
});

