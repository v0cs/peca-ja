import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SolicitationStatus from "../SolicitationStatus";

describe("SolicitationStatus", () => {
  it("deve renderizar status 'ativa' corretamente", () => {
    render(<SolicitationStatus status="ativa" />);
    
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    const badge = screen.getByText("Ativa");
    expect(badge).toHaveClass("bg-green-100", "text-green-800");
  });

  it("deve renderizar status 'concluida' corretamente", () => {
    render(<SolicitationStatus status="concluida" />);
    
    expect(screen.getByText("Concluída")).toBeInTheDocument();
    const badge = screen.getByText("Concluída");
    expect(badge).toHaveClass("bg-blue-100", "text-blue-800");
  });

  it("deve renderizar status 'cancelada' corretamente", () => {
    render(<SolicitationStatus status="cancelada" />);
    
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    const badge = screen.getByText("Cancelada");
    expect(badge).toHaveClass("bg-red-100", "text-red-800");
  });

  it("deve renderizar status desconhecido com estilo padrão", () => {
    render(<SolicitationStatus status="desconhecido" />);
    
    expect(screen.getByText("desconhecido")).toBeInTheDocument();
    const badge = screen.getByText("desconhecido");
    expect(badge).toHaveClass("bg-gray-100", "text-gray-800");
  });

  it("deve renderizar 'Desconhecido' quando status é null", () => {
    render(<SolicitationStatus status={null} />);
    
    expect(screen.getByText("Desconhecido")).toBeInTheDocument();
  });

  it("deve renderizar 'Desconhecido' quando status é undefined", () => {
    render(<SolicitationStatus status={undefined} />);
    
    expect(screen.getByText("Desconhecido")).toBeInTheDocument();
  });
});


