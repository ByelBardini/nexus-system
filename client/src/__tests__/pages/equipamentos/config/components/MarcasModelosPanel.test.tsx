import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarcasModelosPanel } from "@/pages/equipamentos/config/components/MarcasModelosPanel";
import type { MarcaRastreador, ModeloRastreador } from "@/pages/equipamentos/config/domain/equipamentos-config.types";
import { buildModelosByMarca } from "@/pages/equipamentos/config/domain/equipamentos-config.helpers";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

const m1: MarcaRastreador = {
  id: 1,
  nome: "MarcaX",
  ativo: true,
  _count: { modelos: 1 },
};

const mod: ModeloRastreador = {
  id: 99,
  nome: "ModY",
  ativo: true,
  marca: { id: 1, nome: "MarcaX", ativo: true },
};

const mut = { isPending: false, mutate: vi.fn() } as any;

function baseProps(over: Partial<Parameters<typeof MarcasModelosPanel>[0]> = {}) {
  return {
    canEdit: true,
    searchMarcas: "",
    onSearchMarcas: vi.fn(),
    expandedMarcaIds: new Set<number>([1]),
    filteredMarcas: [m1],
    modelosByMarca: buildModelosByMarca([mod]),
    totalModelos: 1,
    onToggleMarca: vi.fn(),
    onOpenCreateMarca: vi.fn(),
    onOpenEditMarca: vi.fn(),
    onToggleAtivoMarca: vi.fn(),
    onDeleteMarca: vi.fn(),
    onOpenCreateModelo: vi.fn(),
    onOpenEditModelo: vi.fn(),
    onToggleAtivoModelo: vi.fn(),
    onDeleteModelo: vi.fn(),
    deleteMarcaMutation: mut,
    deleteModeloMutation: mut,
    ...over,
  };
}

describe("MarcasModelosPanel", () => {
  it("exibe busca, marca expandida com modelo e totais", () => {
    render(<MarcasModelosPanel {...baseProps()} />);
    expect(
      screen.getByPlaceholderText("Pesquisar marca ou modelo..."),
    ).toBeInTheDocument();
    expect(screen.getByText("MarcaX")).toBeInTheDocument();
    expect(screen.getByText("ModY")).toBeInTheDocument();
    expect(screen.getByText(/1 Marcas \/ 1 Modelos/)).toBeInTheDocument();
  });

  it("sem canEdit oculta Nova Marca e menu de editar no cabeçalho da linha (ícone add na área de lista)", () => {
    render(<MarcasModelosPanel {...baseProps({ canEdit: false })} />);
    expect(screen.queryByRole("button", { name: /nova marca/i })).toBeNull();
  });

  it("lista vazia exibe mensagem", () => {
    render(
      <MarcasModelosPanel
        {...baseProps({ filteredMarcas: [], totalModelos: 0 })}
      />,
    );
    expect(screen.getByText("Nenhuma marca encontrada")).toBeInTheDocument();
  });

  it("digitar na busca chama onSearchMarcas", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(
      <MarcasModelosPanel
        {...baseProps({ onSearchMarcas: onSearch })}
      />,
    );
    await user.type(
      screen.getByPlaceholderText("Pesquisar marca ou modelo..."),
      "x",
    );
    expect(onSearch).toHaveBeenCalled();
  });
});
