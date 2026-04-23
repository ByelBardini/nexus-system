import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EquipamentosTable } from "@/pages/equipamentos/lista/components/EquipamentosTable";
import type { EquipamentoListItem } from "@/pages/equipamentos/lista/equipamentos-page.shared";
import { EQUIPAMENTOS_LIST_PAGE_SIZE } from "@/pages/equipamentos/lista/equipamentos-page.shared";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => <span />,
}));

function row(id: number): EquipamentoListItem {
  return {
    id,
    tipo: "RASTREADOR",
    status: "CONFIGURADO",
    proprietario: "INFINITY",
    criadoEm: "",
    atualizadoEm: "",
    simVinculado: { id, identificador: `iccid-${id}` },
  } as EquipamentoListItem;
}

describe("EquipamentosTable", () => {
  it("lista vazia mostra mensagem e footer com 0", () => {
    const setExpanded = vi.fn();
    render(
      <EquipamentosTable
        paginated={[]}
        filtered={[]}
        page={0}
        totalPages={1}
        expandedId={null}
        setExpandedId={setExpanded}
        kitsPorId={new Map()}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("equipamentos-empty")).toBeInTheDocument();
    expect(screen.getByTestId("equipamentos-table-footer")).toHaveTextContent(
      "Exibindo 0-0 de 0",
    );
  });

  it("renderiza linhas e paginação chama onPageChange", async () => {
    const user = userEvent.setup();
    const onPage = vi.fn();
    const list = [row(1), row(2)];
    render(
      <EquipamentosTable
        paginated={list}
        filtered={list}
        page={0}
        totalPages={2}
        expandedId={null}
        setExpandedId={vi.fn()}
        kitsPorId={new Map()}
        onPageChange={onPage}
      />,
    );
    expect(screen.getByTestId("equipamento-row-1")).toBeInTheDocument();
    await user.click(screen.getByTestId("equipamentos-page-1"));
    expect(onPage).toHaveBeenCalledWith(1);
  });

  it("edge: muitas páginas mantém janela de 5 botões numéricos", () => {
    const list = Array.from({ length: EQUIPAMENTOS_LIST_PAGE_SIZE }, (_, i) =>
      row(i + 1),
    );
    render(
      <EquipamentosTable
        paginated={list}
        filtered={Array.from({ length: 60 }, (_, i) => row(i + 1))}
        page={2}
        totalPages={5}
        expandedId={null}
        setExpandedId={vi.fn()}
        kitsPorId={new Map()}
        onPageChange={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId("equipamentos-pagination").querySelectorAll("button")
        .length,
    ).toBe(7);
  });
});
