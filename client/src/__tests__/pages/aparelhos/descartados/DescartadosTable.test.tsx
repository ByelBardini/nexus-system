import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DescartadosTable } from "@/pages/aparelhos/descartados/DescartadosTable";
import type { AparelhoDescartado } from "@/pages/aparelhos/descartados/useDescartadosList";

const fixture = (
  overrides: Partial<AparelhoDescartado> = {},
): AparelhoDescartado => ({
  id: 1,
  tipo: "RASTREADOR",
  identificador: "IMEI001",
  proprietario: "INFINITY",
  marca: "Suntech",
  modelo: "ST-901",
  operadora: null,
  categoriaFalha: "Dano físico",
  motivoDefeito: "Antena partida",
  responsavel: "Técnico A",
  descartadoEm: "2026-04-01T00:00:00.000Z",
  criadoEm: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("DescartadosTable", () => {
  it("exibe mensagem de vazio quando lista está vazia", () => {
    render(<DescartadosTable lista={[]} />);
    expect(
      screen.getByText(/Nenhum aparelho descartado encontrado/i),
    ).toBeInTheDocument();
  });

  it("renderiza colunas do cabeçalho", () => {
    render(<DescartadosTable lista={[fixture()]} />);
    const table = screen.getByTestId("descartados-table");
    expect(within(table).getByText(/Identificador/i)).toBeInTheDocument();
    expect(within(table).getByText(/Tipo/i)).toBeInTheDocument();
    expect(within(table).getByText(/Categoria de Falha/i)).toBeInTheDocument();
    expect(within(table).getByText(/Descartado em/i)).toBeInTheDocument();
  });

  it("renderiza dados de uma linha", () => {
    render(<DescartadosTable lista={[fixture()]} />);
    const row = screen.getByTestId("descartado-row-1");
    expect(within(row).getByText("IMEI001")).toBeInTheDocument();
    expect(within(row).getByText("RASTREADOR")).toBeInTheDocument();
    expect(within(row).getByText("Suntech / ST-901")).toBeInTheDocument();
    expect(within(row).getByText("Dano físico")).toBeInTheDocument();
    expect(within(row).getByText("Antena partida")).toBeInTheDocument();
    expect(within(row).getByText("Infinity")).toBeInTheDocument();
  });

  it("proprietário CLIENTE exibe 'Cliente'", () => {
    render(<DescartadosTable lista={[fixture({ proprietario: "CLIENTE" })]} />);
    expect(screen.getByText("Cliente")).toBeInTheDocument();
  });

  it("campos nulos exibem '—'", () => {
    render(
      <DescartadosTable
        lista={[
          fixture({
            identificador: null,
            marca: null,
            modelo: null,
            categoriaFalha: null,
            motivoDefeito: null,
            descartadoEm: null,
          }),
        ]}
      />,
    );
    const row = screen.getByTestId("descartado-row-1");
    const dashes = within(row).getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("renderiza múltiplos registros", () => {
    render(
      <DescartadosTable
        lista={[
          fixture({ id: 1, identificador: "IMEI001" }),
          fixture({ id: 2, identificador: "IMEI002" }),
        ]}
      />,
    );
    expect(screen.getByTestId("descartado-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("descartado-row-2")).toBeInTheDocument();
  });
});
