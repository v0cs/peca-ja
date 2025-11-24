import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

describe("Footer", () => {
  it("deve renderizar o logo e nome da aplicação", () => {
    render(<Footer />);
    expect(screen.getByText("PeçaJá")).toBeInTheDocument();
  });

  it("deve renderizar a mensagem de descrição", () => {
    render(<Footer />);
    expect(
      screen.getByText("Conectando você às melhores autopeças da sua cidade")
    ).toBeInTheDocument();
  });

  it("deve renderizar o copyright com o ano atual", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} PeçaJá. Todos os direitos reservados.`)
    ).toBeInTheDocument();
  });

  it("deve ter a estrutura correta de footer", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("border-t", "bg-card/30", "py-8", "mt-auto");
  });
});


