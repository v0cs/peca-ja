import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatsCard from "../StatsCard";

describe("StatsCard", () => {
  it("deve renderizar título e valor", () => {
    render(<StatsCard title="Total" value="100" />);
    
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("deve renderizar subtítulo quando fornecido", () => {
    render(
      <StatsCard
        title="Total"
        value="100"
        subtitle="Últimos 30 dias"
      />
    );
    
    expect(screen.getByText("Últimos 30 dias")).toBeInTheDocument();
  });

  it("não deve renderizar subtítulo quando não fornecido", () => {
    render(<StatsCard title="Total" value="100" />);
    
    expect(screen.queryByText(/últimos/i)).not.toBeInTheDocument();
  });

  it("deve renderizar ícone quando fornecido", () => {
    const icon = <span data-testid="icon">📊</span>;
    render(
      <StatsCard
        title="Total"
        value="100"
        icon={icon}
      />
    );
    
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("não deve renderizar ícone quando não fornecido", () => {
    render(<StatsCard title="Total" value="100" />);
    
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("deve renderizar valor com classe de texto primário", () => {
    render(<StatsCard title="Total" value="100" />);
    
    const valueElement = screen.getByText("100");
    expect(valueElement).toHaveClass("text-primary");
  });

  it("deve renderizar estrutura completa com todos os elementos", () => {
    const icon = <span data-testid="icon">📊</span>;
    render(
      <StatsCard
        title="Vendas"
        value="1.234"
        subtitle="Este mês"
        icon={icon}
      />
    );
    
    expect(screen.getByText("Vendas")).toBeInTheDocument();
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.getByText("Este mês")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});

