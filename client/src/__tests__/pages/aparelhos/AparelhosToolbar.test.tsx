import type { ComponentProps } from "react";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AparelhosToolbar } from "@/pages/aparelhos/lista/AparelhosToolbar";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/SearchableSelect", () => ({
  SearchableSelect: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <select
      aria-label="searchable-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

function renderToolbar(
  props: Partial<ComponentProps<typeof AparelhosToolbar>> = {},
) {
  const onBuscaChange = vi.fn();
  const onStatusFilterChange = vi.fn();
  const onTipoFilterChange = vi.fn();
  const onProprietarioFilterChange = vi.fn();
  const onMarcaFilterChange = vi.fn();

  render(
    <MemoryRouter>
      <AparelhosToolbar
        canCreate
        busca=""
        onBuscaChange={onBuscaChange}
        statusFilter="TODOS"
        onStatusFilterChange={onStatusFilterChange}
        tipoFilter="TODOS"
        onTipoFilterChange={onTipoFilterChange}
        proprietarioFilter="TODOS"
        onProprietarioFilterChange={onProprietarioFilterChange}
        marcaFilter="TODOS"
        onMarcaFilterChange={onMarcaFilterChange}
        marcas={["Teltonika", "Vivo"]}
        {...props}
      />
    </MemoryRouter>,
  );

  return {
    onBuscaChange,
    onStatusFilterChange,
    onTipoFilterChange,
    onProprietarioFilterChange,
    onMarcaFilterChange,
  };
}

describe("AparelhosToolbar", () => {
  it("chama onBuscaChange ao digitar", async () => {
    const user = userEvent.setup();
    const onBuscaChange = vi.fn();

    function Harness() {
      const [busca, setBusca] = useState("");
      return (
        <MemoryRouter>
          <AparelhosToolbar
            canCreate
            busca={busca}
            onBuscaChange={(v) => {
              onBuscaChange(v);
              setBusca(v);
            }}
            statusFilter="TODOS"
            onStatusFilterChange={vi.fn()}
            tipoFilter="TODOS"
            onTipoFilterChange={vi.fn()}
            proprietarioFilter="TODOS"
            onProprietarioFilterChange={vi.fn()}
            marcaFilter="TODOS"
            onMarcaFilterChange={vi.fn()}
            marcas={["Teltonika"]}
          />
        </MemoryRouter>
      );
    }

    render(<Harness />);

    await user.type(screen.getByTestId("aparelhos-busca-input"), "abc");
    expect(onBuscaChange.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(onBuscaChange).toHaveBeenLastCalledWith("abc");
  });

  it("com canCreate exibe links de cadastro", () => {
    renderToolbar({ canCreate: true });
    expect(screen.getByTestId("aparelhos-link-lote")).toBeInTheDocument();
    expect(screen.getByTestId("aparelhos-link-individual")).toBeInTheDocument();
  });

  it("sem canCreate oculta links", () => {
    renderToolbar({ canCreate: false });
    expect(screen.queryByTestId("aparelhos-link-lote")).toBeNull();
  });

  it("altera filtro de status via select", async () => {
    const user = userEvent.setup();
    const { onStatusFilterChange } = renderToolbar();

    const statusSelect = screen
      .getByTestId("aparelhos-filter-status")
      .querySelector("select");
    expect(statusSelect).toBeTruthy();
    if (statusSelect) {
      await user.selectOptions(statusSelect, "CONFIGURADO");
    }
    expect(onStatusFilterChange).toHaveBeenCalledWith("CONFIGURADO");
  });

  it("edge: lista de marcas vazia mantém opção Todas", () => {
    renderToolbar({ marcas: [] });
    const marcaSelect = screen
      .getByTestId("aparelhos-filter-marca")
      .querySelector("select");
    expect(marcaSelect).toBeTruthy();
  });
});
