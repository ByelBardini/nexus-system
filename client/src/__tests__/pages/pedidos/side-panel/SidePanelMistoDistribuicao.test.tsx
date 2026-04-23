import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildPedidoView } from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";
import { SidePanelMistoDistribuicao } from "@/pages/pedidos/side-panel/components/SidePanelMistoDistribuicao";

describe("SidePanelMistoDistribuicao", () => {
  it("retorna null quando não é misto", () => {
    const { container } = render(
      <SidePanelMistoDistribuicao
        pedido={buildPedidoView({ tipo: "cliente" })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("lista itens, total e retorna null sem itensMisto", () => {
    const { container: empty } = render(
      <SidePanelMistoDistribuicao
        pedido={buildPedidoView({ tipo: "misto", itensMisto: [] })}
      />,
    );
    expect(empty.firstChild).toBeNull();

    render(
      <SidePanelMistoDistribuicao
        pedido={buildPedidoView({
          tipo: "misto",
          quantidade: 7,
          itensMisto: [
            { label: "A", quantidade: 3 },
            { label: "B", quantidade: 4 },
          ],
        })}
      />,
    );
    expect(screen.getByText("Distribuição dos Itens")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("3 un")).toBeInTheDocument();
    expect(screen.getByText("7 un")).toBeInTheDocument();
  });
});
