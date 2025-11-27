import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
  it("deve renderizar badge ativo quando ativo é true", () => {
    render(<StatusBadge ativo={true} />);
    
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    const badge = screen.getByText("Ativo");
    expect(badge).toHaveClass("bg-green-100", "text-green-800");
  });

  it("deve renderizar badge inativo quando ativo é false", () => {
    render(<StatusBadge ativo={false} />);
    
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    const badge = screen.getByText("Inativo");
    expect(badge).toHaveClass("bg-red-100", "text-red-800");
  });

  it("deve aceitar className customizada quando ativo", () => {
    render(<StatusBadge ativo={true} className="custom-class" />);
    const badge = screen.getByText("Ativo");
    expect(badge).toHaveClass("custom-class");
  });

  it("deve aceitar className customizada quando inativo", () => {
    render(<StatusBadge ativo={false} className="custom-class" />);
    const badge = screen.getByText("Inativo");
    expect(badge).toHaveClass("custom-class");
  });

  it("deve renderizar ícone CheckCircle quando ativo", () => {
    render(<StatusBadge ativo={true} />);
    const badge = screen.getByText("Ativo");
    const icon = badge.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("deve renderizar ícone XCircle quando inativo", () => {
    render(<StatusBadge ativo={false} />);
    const badge = screen.getByText("Inativo");
    const icon = badge.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});




