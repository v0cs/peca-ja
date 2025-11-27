import { render, screen, fireEvent } from "@testing-library/react";
import ProfileTabs from "../ProfileTabs";

describe("ProfileTabs", () => {
  const mockTabs = [
    { id: "perfil", label: "Perfil" },
    { id: "senha", label: "Senha" },
    { id: "configuracoes", label: "Configurações" },
  ];

  it("deve renderizar todas as tabs", () => {
    render(
      <ProfileTabs tabs={mockTabs} activeTab="perfil" onTabChange={vi.fn()} />
    );

    expect(screen.getByText("Perfil")).toBeInTheDocument();
    expect(screen.getByText("Senha")).toBeInTheDocument();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("deve destacar a tab ativa", () => {
    render(
      <ProfileTabs tabs={mockTabs} activeTab="senha" onTabChange={vi.fn()} />
    );

    const activeTab = screen.getByText("Senha");
    expect(activeTab).toHaveClass("border-primary-500", "text-primary-600");
  });

  it("deve aplicar estilos corretos para tabs inativas", () => {
    render(
      <ProfileTabs tabs={mockTabs} activeTab="perfil" onTabChange={vi.fn()} />
    );

    const inactiveTab = screen.getByText("Senha");
    expect(inactiveTab).toHaveClass("border-transparent", "text-gray-500");
  });

  it("deve chamar onTabChange ao clicar em uma tab", () => {
    const onTabChange = vi.fn();
    render(
      <ProfileTabs tabs={mockTabs} activeTab="perfil" onTabChange={onTabChange} />
    );

    const senhaTab = screen.getByText("Senha");
    fireEvent.click(senhaTab);

    expect(onTabChange).toHaveBeenCalledWith("senha");
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  it("deve funcionar sem onTabChange", () => {
    render(<ProfileTabs tabs={mockTabs} activeTab="perfil" />);

    const senhaTab = screen.getByText("Senha");
    // Não deve lançar erro ao clicar sem onTabChange
    fireEvent.click(senhaTab);
    expect(screen.getByText("Senha")).toBeInTheDocument();
  });

  it("deve renderizar corretamente com array vazio", () => {
    render(<ProfileTabs tabs={[]} activeTab="" onTabChange={vi.fn()} />);

    const nav = screen.getByRole("navigation", { name: "Perfil" });
    expect(nav).toBeInTheDocument();
    expect(nav.children).toHaveLength(0);
  });

  it("deve renderizar corretamente sem tabs prop (usando default)", () => {
    render(<ProfileTabs activeTab="" onTabChange={vi.fn()} />);

    const nav = screen.getByRole("navigation", { name: "Perfil" });
    expect(nav).toBeInTheDocument();
  });
});




