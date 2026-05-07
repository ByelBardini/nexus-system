import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PedidosKanbanColumnShell } from "@/pages/pedidos/lista/components/PedidosKanbanColumnShell";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

describe("PedidosKanbanColumnShell", () => {
  it("mostra o rótulo do status e a contagem; renderiza filhos", () => {
    render(
      <PedidosKanbanColumnShell status="solicitado" count={2} variant="default">
        <p>conteúdo</p>
      </PedidosKanbanColumnShell>,
    );
    expect(screen.getByText("Solicitado")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("variant config aplica o layout de coluna flexível (config)", () => {
    const { container } = render(
      <PedidosKanbanColumnShell status="entregue" count={0} variant="config">
        <span>v</span>
      </PedidosKanbanColumnShell>,
    );
    const col = container.firstChild as HTMLElement;
    expect(col.className).toContain("flex-1");
    expect(col.className).toContain("min-w-[280px]");
  });
});
