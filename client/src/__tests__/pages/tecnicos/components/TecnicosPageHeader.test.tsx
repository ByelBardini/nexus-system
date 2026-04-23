import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import type { UF } from "@/hooks/useBrasilAPI";
import { TecnicosPageHeader } from "@/pages/tecnicos/components/TecnicosPageHeader";

const ufSp: UF = {
  id: 35,
  sigla: "SP",
  nome: "São Paulo",
  regiao: { id: 3, sigla: "SE", nome: "Sudeste" },
};

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/SearchableSelect", () => ({
  SearchableSelect: ({
    value,
    onChange,
    options,
    "aria-label": ariaLabel,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    "aria-label"?: string;
  }) => (
    <select
      aria-label={ariaLabel ?? "searchable-select"}
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

describe("TecnicosPageHeader", () => {
  it("dispara onBuscaChange e mostra botão novo quando canCreate", async () => {
    const user = userEvent.setup();
    const onBusca = vi.fn();
    render(
      <MemoryRouter>
        <TecnicosPageHeader
          busca=""
          onBuscaChange={onBusca}
          filtroEstado="todos"
          onFiltroEstadoChange={vi.fn()}
          filtroStatus="todos"
          onFiltroStatusChange={vi.fn()}
          ufs={[ufSp]}
          canCreate
          onNovoTecnico={vi.fn()}
        />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText(/Nome ou CPF/i), "a");
    expect(onBusca).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Novo Técnico/i }),
    ).toBeInTheDocument();
  });

  it("edge: oculta Novo Técnico quando canCreate false", () => {
    render(
      <MemoryRouter>
        <TecnicosPageHeader
          busca=""
          onBuscaChange={vi.fn()}
          filtroEstado="todos"
          onFiltroEstadoChange={vi.fn()}
          filtroStatus="todos"
          onFiltroStatusChange={vi.fn()}
          ufs={[]}
          canCreate={false}
          onNovoTecnico={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("button", { name: /Novo Técnico/i })).toBeNull();
  });
});
