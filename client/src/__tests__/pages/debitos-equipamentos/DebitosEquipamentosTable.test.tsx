import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DebitosEquipamentosTable } from "@/pages/debitos-equipamentos/components/DebitosEquipamentosTable";
import { mapDebitoApiToView } from "@/pages/debitos-equipamentos/domain/mapDebitoApiToView";
import { buildDebitoRastreadorListaApi } from "./debitos-equipamentos.fixtures";

describe("DebitosEquipamentosTable", () => {
  it("lista vazia mostra mensagem", () => {
    render(
      <DebitosEquipamentosTable
        filtered={[]}
        expandedId={null}
        onExpandedChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Nenhum débito encontrado.")).toBeInTheDocument();
  });

  it("renderiza linha com ID e alterna expansão", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    const debito = mapDebitoApiToView(
      buildDebitoRastreadorListaApi({ id: 99 }),
    );
    const { rerender } = render(
      <DebitosEquipamentosTable
        filtered={[debito]}
        expandedId={null}
        onExpandedChange={onExpand}
      />,
    );
    expect(screen.getByText("#99")).toBeInTheDocument();
    await user.click(screen.getByText("Acme Ltda"));
    expect(onExpand).toHaveBeenCalled();
    rerender(
      <DebitosEquipamentosTable
        filtered={[debito]}
        expandedId={99}
        onExpandedChange={onExpand}
      />,
    );
    expect(screen.getByText("Distribuição de Modelos")).toBeInTheDocument();
    expect(screen.getByText("Histórico de Movimentações")).toBeInTheDocument();
  });
});
