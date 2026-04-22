import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OperadorasTablePanel } from "@/pages/equipamentos/config/components/OperadorasTablePanel";
import type { Operadora } from "@/pages/equipamentos/config/domain/equipamentos-config.types";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => <span data-icon="m" />,
}));

const mut = { isPending: false, mutate: vi.fn() } as any;

const op: Operadora = { id: 1, nome: "Vivo", ativo: true };

describe("OperadorasTablePanel", () => {
  it("mostra tabela e total", () => {
    render(
      <OperadorasTablePanel
        canEdit
        searchOperadoras=""
        onSearchOperadoras={vi.fn()}
        filteredOperadoras={[op]}
        onOpenCreateOperadora={vi.fn()}
        onOpenEditOperadora={vi.fn()}
        onToggleAtivo={vi.fn()}
        onDelete={vi.fn()}
        deleteOperadoraMutation={mut}
      />,
    );
    expect(screen.getByText("Vivo")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Total: 1 Operadoras Registradas/,
      ),
    ).toBeInTheDocument();
  });

  it("sem canEdit esconde coluna de ações (apenas 2 colunas de dados)", () => {
    const { container } = render(
      <OperadorasTablePanel
        canEdit={false}
        searchOperadoras=""
        onSearchOperadoras={vi.fn()}
        filteredOperadoras={[]}
        onOpenCreateOperadora={vi.fn()}
        onOpenEditOperadora={vi.fn()}
        onToggleAtivo={vi.fn()}
        onDelete={vi.fn()}
        deleteOperadoraMutation={mut}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /nova operadora/i }),
    ).toBeNull();
    const ths = container.querySelectorAll("thead th");
    expect(ths).toHaveLength(2);
  });
});
