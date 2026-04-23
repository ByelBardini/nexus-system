import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PedidosKanbanColumnEmptyState } from "@/pages/pedidos/lista/components/PedidosKanbanColumnEmptyState";

describe("PedidosKanbanColumnEmptyState", () => {
  it("renderiza a mensagem e classes base do placeholder", () => {
    const { container } = render(
      <PedidosKanbanColumnEmptyState message="Nenhum pedido nesta etapa" />,
    );
    const el = screen.getByText("Nenhum pedido nesta etapa");
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/border-dashed/);
    expect(container.firstChild).toBe(el);
  });

  it("aceita className extra", () => {
    render(
      <PedidosKanbanColumnEmptyState
        message="Vazio"
        className="data-test-empty"
      />,
    );
    expect(screen.getByText("Vazio")).toHaveClass("data-test-empty");
  });
});
