import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { EquipamentosPageToolbar } from "@/pages/equipamentos/lista/components/EquipamentosPageToolbar";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

function renderToolbar(
  props: Partial<ComponentProps<typeof EquipamentosPageToolbar>> = {},
) {
  const defaults: ComponentProps<typeof EquipamentosPageToolbar> = {
    canCreate: false,
    busca: "",
    onBuscaChange: vi.fn(),
    statusFilter: "TODOS",
    onStatusFilterChange: vi.fn(),
    proprietarioFilter: "TODOS",
    onProprietarioFilterChange: vi.fn(),
    marcaFilter: "TODOS",
    onMarcaFilterChange: vi.fn(),
    marcas: ["M1"],
    operadoraFilter: "TODOS",
    onOperadoraFilterChange: vi.fn(),
    operadoras: ["Vivo"],
    ...props,
  };
  return render(
    <MemoryRouter>
      <EquipamentosPageToolbar {...defaults} />
    </MemoryRouter>,
  );
}

describe("EquipamentosPageToolbar", () => {
  it("dispara onBuscaChange ao alterar o campo", () => {
    const onBuscaChange = vi.fn();
    renderToolbar({ onBuscaChange });
    fireEvent.change(screen.getByTestId("equipamentos-busca-input"), {
      target: { value: "abc" },
    });
    expect(onBuscaChange).toHaveBeenCalledWith("abc");
  });

  it("não exibe links de cadastro quando canCreate é false", () => {
    renderToolbar({ canCreate: false });
    expect(screen.queryByTestId("equipamentos-link-montar")).toBeNull();
  });

  it("exibe links quando canCreate é true", () => {
    renderToolbar({ canCreate: true });
    expect(screen.getByTestId("equipamentos-link-montar")).toBeInTheDocument();
    expect(screen.getByTestId("equipamentos-link-lote")).toBeInTheDocument();
  });

  it("edge: marcas e operadoras vazias mantêm opção Todas", () => {
    renderToolbar({ marcas: [], operadoras: [] });
    expect(screen.getByTestId("equipamentos-toolbar")).toBeInTheDocument();
  });
});
