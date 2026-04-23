import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DebitosEquipamentosSummaryCards } from "@/pages/debitos-equipamentos/components/DebitosEquipamentosSummaryCards";
import type { DebitosEquipamentosStats } from "@/pages/debitos-equipamentos/domain/debitos-equipamentos-helpers";

const statsBase: DebitosEquipamentosStats = {
  totalAparelhosDevidos: 12,
  saldoMes: 3,
  devedoresCliente: 4,
  devedoresInfinity: 2,
  pctCliente: 67,
  modelosAtivos: 5,
  modeloPredominante: "Marca X",
};

describe("DebitosEquipamentosSummaryCards", () => {
  it("exibe totais e rótulos das três colunas", () => {
    render(<DebitosEquipamentosSummaryCards stats={statsBase} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Aparelhos Devidos")).toBeInTheDocument();
    expect(screen.getByText("Clientes Devedores")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Modelos Ativos")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Marca X")).toBeInTheDocument();
  });

  it("saldo negativo usa ícone de tendência de baixa (texto verde)", () => {
    render(
      <DebitosEquipamentosSummaryCards
        stats={{ ...statsBase, saldoMes: -2 }}
      />,
    );
    expect(screen.getByText(/-2 un\./)).toBeInTheDocument();
  });

  it("pctCliente 0 exibe 100% infinity", () => {
    render(
      <DebitosEquipamentosSummaryCards
        stats={{ ...statsBase, pctCliente: 0, devedoresCliente: 0 }}
      />,
    );
    expect(screen.getByText("0% clientes")).toBeInTheDocument();
    expect(screen.getByText("100% infinity")).toBeInTheDocument();
  });
});
