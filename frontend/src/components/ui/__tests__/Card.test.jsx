import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../Card";

describe("Card", () => {
  it("deve renderizar Card com conteúdo", () => {
    render(
      <Card>
        <div>Conteúdo do card</div>
      </Card>
    );
    expect(screen.getByText("Conteúdo do card")).toBeInTheDocument();
  });

  it("deve aceitar className customizada", () => {
    const { container } = render(<Card className="custom-class">Teste</Card>);
    const card = container.querySelector(".custom-class");
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent("Teste");
  });

  it("deve renderizar CardHeader com CardTitle", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText("Título do Card")).toBeInTheDocument();
  });

  it("deve renderizar CardDescription", () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Descrição do card</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText("Descrição do card")).toBeInTheDocument();
  });

  it("deve renderizar CardContent", () => {
    render(
      <Card>
        <CardContent>
          <p>Conteúdo principal</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText("Conteúdo principal")).toBeInTheDocument();
  });

  it("deve renderizar CardFooter", () => {
    render(
      <Card>
        <CardFooter>
          <button>Ação</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByRole("button", { name: /ação/i })).toBeInTheDocument();
  });

  it("deve renderizar estrutura completa do Card", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título</CardTitle>
          <CardDescription>Descrição</CardDescription>
        </CardHeader>
        <CardContent>Conteúdo</CardContent>
        <CardFooter>Rodapé</CardFooter>
      </Card>
    );

    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Descrição")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Rodapé")).toBeInTheDocument();
  });

  it("deve aceitar className em CardHeader", () => {
    render(
      <Card>
        <CardHeader className="custom-header">
          <CardTitle>Teste</CardTitle>
        </CardHeader>
      </Card>
    );
    const header = screen.getByText("Teste").parentElement;
    expect(header).toHaveClass("custom-header");
  });
});

