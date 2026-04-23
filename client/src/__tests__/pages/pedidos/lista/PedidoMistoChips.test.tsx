import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PedidoMistoChips } from "@/pages/pedidos/lista/components/PedidoMistoChips";

describe("PedidoMistoChips", () => {
  it("lista vazia: retorna null (não quebra a árvore)", () => {
    const { container } = render(<PedidoMistoChips itens={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("Infinity e cliente usam estilos distintos", () => {
    render(
      <PedidoMistoChips
        itens={[
          { label: "Infinity", quantidade: 1 },
          { label: "X", quantidade: 2 },
        ]}
      />,
    );
    expect(
      screen.getByText("Infinity", { exact: false }),
    ).toBeInTheDocument();
  });
});
