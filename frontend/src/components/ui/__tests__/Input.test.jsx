import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Input from "../Input";

describe("Input", () => {
  it("deve renderizar input sem label", () => {
    render(<Input id="test-input" />);
    const input = document.getElementById("test-input");
    expect(input).toBeInTheDocument();
  });

  it("deve renderizar input com label", () => {
    render(<Input id="test-input" label="Nome" />);
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });

  it("deve exibir asterisco quando required é true", () => {
    render(<Input id="test-input" label="Email" required />);
    const label = screen.getByText("Email");
    expect(label.querySelector(".text-red-500")).toBeInTheDocument();
  });

  it("não deve exibir asterisco quando required é false", () => {
    render(<Input id="test-input" label="Email" required={false} />);
    const label = screen.getByText("Email");
    const asterisk = label.querySelector(".text-red-500");
    expect(asterisk).not.toBeInTheDocument();
  });

  it("deve renderizar placeholder", () => {
    render(<Input id="test-input" placeholder="Digite seu nome" />);
    const input = screen.getByPlaceholderText("Digite seu nome");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Digite seu nome");
  });

  it("deve renderizar com valor inicial", () => {
    render(<Input id="test-input" value="Valor inicial" onChange={() => {}} />);
    const input = screen.getByDisplayValue("Valor inicial");
    expect(input).toBeInTheDocument();
  });

  it("deve chamar onChange quando valor muda", () => {
    const handleChange = vi.fn();
    
    render(<Input id="test-input" onChange={handleChange} />);
    
    const input = document.getElementById("test-input");
    fireEvent.change(input, { target: { value: "teste" } });
    
    expect(handleChange).toHaveBeenCalled();
    expect(input.value).toBe("teste");
  });

  it("deve exibir mensagem de erro quando error é fornecido", () => {
    render(<Input id="test-input" error="Campo obrigatório" />);
    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
  });

  it("deve aplicar classe de erro quando error é fornecido", () => {
    render(<Input id="test-input" error="Erro" />);
    const input = document.getElementById("test-input");
    expect(input).toHaveClass("border-red-300");
  });

  it("deve renderizar input do tipo password", () => {
    render(<Input id="test-input" type="password" />);
    const input = document.getElementById("test-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("deve aceitar className customizada", () => {
    render(<Input id="test-input" className="custom-class" />);
    const input = document.getElementById("test-input");
    expect(input).toHaveClass("custom-class");
  });

  it("deve passar props adicionais para o input", () => {
    render(<Input id="test-input" data-testid="custom-input" maxLength={10} />);
    const input = screen.getByTestId("custom-input");
    expect(input).toHaveAttribute("maxLength", "10");
  });
});

