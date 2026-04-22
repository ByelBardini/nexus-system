import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarcasSimcardPanel } from "@/pages/equipamentos/config/components/MarcasSimcardPanel";
import type { MarcaSimcard } from "@/pages/equipamentos/config/domain/equipamentos-config.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => <span data-icon="m" />,
}));

const mut = { isPending: false, mutate: vi.fn() } as any;

const m: MarcaSimcard = {
  id: 1,
  nome: "SimM",
  operadoraId: 1,
  temPlanos: true,
  ativo: true,
  operadora: { id: 1, nome: "Vivo" },
  planos: [{ id: 1, marcaSimcardId: 1, planoMb: 500, ativo: true }],
};

describe("MarcasSimcardPanel", () => {
  it("exibe item e plano ativo", () => {
    render(
      <MarcasSimcardPanel
        canEdit
        searchMarcasSimcard=""
        onSearchMarcasSimcard={vi.fn()}
        expandedMarcasSimcardIds={new Set([1])}
        filteredMarcasSimcard={[m]}
        onToggleMarca={vi.fn()}
        onOpenCreateMarca={vi.fn()}
        onOpenEditMarca={vi.fn()}
        onToggleAtivo={vi.fn()}
        onDeleteMarca={vi.fn()}
        onOpenCreatePlano={vi.fn()}
        onOpenEditPlano={vi.fn()}
        onDeletePlano={vi.fn()}
        deleteMarcaSimcardMutation={mut}
        deletePlanoSimcardMutation={mut}
      />,
    );
    expect(screen.getByText("SimM")).toBeInTheDocument();
    expect(screen.getByText("500 MB")).toBeInTheDocument();
  });

  it("com temPlanos false mostra aviso em vez de lista de planos", () => {
    const m2: MarcaSimcard = { ...m, temPlanos: false, planos: [] };
    render(
      <MarcasSimcardPanel
        canEdit
        searchMarcasSimcard=""
        onSearchMarcasSimcard={vi.fn()}
        expandedMarcasSimcardIds={new Set([1])}
        filteredMarcasSimcard={[m2]}
        onToggleMarca={vi.fn()}
        onOpenCreateMarca={vi.fn()}
        onOpenEditMarca={vi.fn()}
        onToggleAtivo={vi.fn()}
        onDeleteMarca={vi.fn()}
        onOpenCreatePlano={vi.fn()}
        onOpenEditPlano={vi.fn()}
        onDeletePlano={vi.fn()}
        deleteMarcaSimcardMutation={mut}
        deletePlanoSimcardMutation={mut}
      />,
    );
    expect(
      screen.getByText(
        /Marca sem planos cadastrados/,
      ),
    ).toBeInTheDocument();
  });
});
