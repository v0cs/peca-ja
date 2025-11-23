import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("deve renderizar com variante padrão", () => {
    render(<Badge>Teste</Badge>);
    const badge = screen.getByText("Teste");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-primary");
  });

  it("deve renderizar com variante secondary", () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText("Secondary");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-secondary");
  });

  it("deve renderizar com variante destructive", () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    const badge = screen.getByText("Destructive");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-destructive");
  });

  it("deve renderizar com variante outline", () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText("Outline");
    expect(badge).toBeInTheDocument();
  });

  it("deve aceitar className customizada", () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge).toHaveClass("custom-class");
  });

  it("deve passar props adicionais para o elemento", () => {
    render(<Badge data-testid="badge-test">Test</Badge>);
    const badge = screen.getByTestId("badge-test");
    expect(badge).toBeInTheDocument();
  });
});

