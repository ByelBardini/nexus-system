import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidePanelHistoricoPedido } from "@/pages/pedidos/side-panel/components/SidePanelHistoricoPedido";

describe("SidePanelHistoricoPedido", () => {
  it("retorna null com histórico vazio", () => {
    const { container } = render(<SidePanelHistoricoPedido historico={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza títulos e descrições", () => {
    render(
      <SidePanelHistoricoPedido
        historico={[
          { titulo: "T1", descricao: "D1", concluido: true },
          { titulo: "T2", descricao: "D2", concluido: false },
        ]}
      />,
    );
    expect(screen.getByText("Histórico do Pedido")).toBeInTheDocument();
    expect(screen.getByText("D1")).toBeInTheDocument();
    expect(screen.getByText("D2")).toBeInTheDocument();
  });
});
