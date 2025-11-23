import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import SolicitacaoCard from "../SolicitacaoCard";

const baseSolicitacao = {
  id: "abc-123",
  descricao_peca: "Retrovisor esquerdo",
  placa: "ABC1D23",
  marca: "Ford",
  modelo: "Fiesta",
  ano_fabricacao: 2020,
  ano_modelo: 2021,
  categoria: "carro",
  cor: "Prata",
  cidade_atendimento: "Joinville",
  uf_atendimento: "SC",
  status_cliente: "ativa",
  data_criacao: "2025-01-01T12:00:00Z",
};

const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("SolicitacaoCard - vendor attribution", () => {
  it("exibe o vendedor quando autopeça visualiza uma solicitação atendida", () => {
    const solicitacao = {
      ...baseSolicitacao,
      vendedor: {
        id: "vend-1",
        nome_completo: "Maria Vendedora",
      },
    };

    renderWithRouter(
      <SolicitacaoCard solicitacao={solicitacao} tipoUsuario="autopeca" />
    );

    expect(screen.getByText("Atendida por")).toBeInTheDocument();
    expect(screen.getByText("Maria Vendedora")).toBeInTheDocument();
  });

  it("não exibe seção de vendedor quando não há vendedor associado", () => {
    renderWithRouter(
      <SolicitacaoCard solicitacao={baseSolicitacao} tipoUsuario="autopeca" />
    );

    expect(screen.queryByText("Atendida por")).not.toBeInTheDocument();
  });

  it("não exibe informações de vendedor para clientes", () => {
    const solicitacao = {
      ...baseSolicitacao,
      vendedor: {
        id: "vend-2",
        nome_completo: "João Vendedor",
      },
    };

    renderWithRouter(
      <SolicitacaoCard solicitacao={solicitacao} tipoUsuario="cliente" />
    );

    expect(screen.queryByText("Atendida por")).not.toBeInTheDocument();
    expect(screen.queryByText("João Vendedor")).not.toBeInTheDocument();
  });
});












