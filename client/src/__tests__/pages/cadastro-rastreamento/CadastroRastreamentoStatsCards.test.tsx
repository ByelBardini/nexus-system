import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CadastroRastreamentoStatsCards } from "@/pages/cadastro-rastreamento/components/CadastroRastreamentoStatsCards";

describe("CadastroRastreamentoStatsCards", () => {
  it("exibe os três totais", () => {
    render(
      <CadastroRastreamentoStatsCards
        statsAguardando={3}
        statsEmCadastro={2}
        statsConcluido={7}
      />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("exibe rótulos das colunas", () => {
    render(
      <CadastroRastreamentoStatsCards
        statsAguardando={0}
        statsEmCadastro={0}
        statsConcluido={0}
      />,
    );
    expect(screen.getByText("Aguardando")).toBeInTheDocument();
    expect(screen.getByText("Em Cadastro")).toBeInTheDocument();
    expect(screen.getByText("Concluídas no Período")).toBeInTheDocument();
  });
});
