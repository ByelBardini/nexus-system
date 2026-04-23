import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KanbanColumn } from "@/pages/pedidos/lista/kanban/KanbanColumn";
import { KanbanColumnConfig } from "@/pages/pedidos/lista/kanban/KanbanColumnConfig";
import { buildPedidoView } from "../../modal-selecao-ekit/modal-selecao-ekit.fixtures";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

describe("KanbanColumn + KanbanColumnConfig (empty state integrado)", () => {
  it("KanbanColumn: coluna vazia exibe mensagem padrão da lista", () => {
    render(
      <KanbanColumn
        status="solicitado"
        pedidos={[]}
        onCardClick={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Nenhum pedido nesta etapa"),
    ).toBeInTheDocument();
  });

  it("KanbanColumnConfig: coluna configurado vazia usa mensagem de espera", () => {
    render(
      <KanbanColumnConfig
        status="configurado"
        pedidos={[]}
        progressPorPedido={{}}
        activeId={null}
        onCardClick={vi.fn()}
      />,
    );
    expect(screen.getByText("Aguardando finalização")).toBeInTheDocument();
  });

  it("KanbanColumnConfig: outro status vazio usa Nenhum pedido", () => {
    render(
      <KanbanColumnConfig
        status="solicitado"
        pedidos={[]}
        progressPorPedido={{}}
        activeId={null}
        onCardClick={vi.fn()}
      />,
    );
    expect(screen.getByText("Nenhum pedido")).toBeInTheDocument();
  });

  it("KanbanColumn com pedidos renderiza card (não empty)", () => {
    const p = buildPedidoView({ id: 1, codigo: "P-X" });
    render(
      <KanbanColumn status="solicitado" pedidos={[p]} onCardClick={vi.fn()} />,
    );
    expect(screen.getByText("P-X")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum pedido nesta etapa"),
    ).not.toBeInTheDocument();
  });
});
