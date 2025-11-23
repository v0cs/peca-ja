import { render, screen } from "@testing-library/react";
import ReadOnlyField from "../ReadOnlyField";

describe("ReadOnlyField", () => {
  it("deve renderizar o label quando fornecido", () => {
    render(<ReadOnlyField label="Nome" value="João Silva" />);
    expect(screen.getByText("Nome")).toBeInTheDocument();
  });

  it("deve renderizar o valor quando fornecido", () => {
    render(<ReadOnlyField label="Nome" value="João Silva" />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("deve exibir '—' quando o valor é undefined", () => {
    render(<ReadOnlyField label="Nome" value={undefined} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("deve exibir '—' quando o valor é null", () => {
    render(<ReadOnlyField label="Nome" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("deve exibir '—' quando o valor é string vazia", () => {
    render(<ReadOnlyField label="Nome" value="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("deve renderizar o helperText quando fornecido", () => {
    render(
      <ReadOnlyField
        label="Email"
        value="test@example.com"
        helperText="Este é o email principal"
      />
    );
    expect(screen.getByText("Este é o email principal")).toBeInTheDocument();
  });

  it("não deve renderizar o label quando não fornecido", () => {
    render(<ReadOnlyField value="Valor sem label" />);
    expect(screen.queryByText("Nome")).not.toBeInTheDocument();
    expect(screen.getByText("Valor sem label")).toBeInTheDocument();
  });

  it("deve renderizar valores numéricos corretamente", () => {
    render(<ReadOnlyField label="Idade" value={25} />);
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("deve renderizar valores zero corretamente", () => {
    render(<ReadOnlyField label="Quantidade" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

