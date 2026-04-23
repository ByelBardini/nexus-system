import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { buildPedidoView } from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";
import { SidePanelHeader } from "@/pages/pedidos/side-panel/components/SidePanelHeader";
import { URGENCIA_STYLE } from "@/pages/pedidos/shared/pedidos-rastreador.types";

function renderNoPainel(children: ReactNode) {
  return render(
    <Sheet open>
      <SheetContent className="p-0">{children}</SheetContent>
    </Sheet>,
  );
}

describe("SidePanelHeader (urgência + URGENCIA_STYLE)", () => {
  it("usa estilo Média para label desconhecida (fallback)", () => {
    const pedido = buildPedidoView({ urgencia: "ValorForaDoMapa" });
    renderNoPainel(<SidePanelHeader pedido={pedido} />);
    const badge = screen.getByText("ValorForaDoMapa");
    for (const cls of URGENCIA_STYLE["Média"]!.badge.split(/\s+/)) {
      if (cls) expect(badge).toHaveClass(cls);
    }
  });

  it("mostra rótulo Misto para tipo misto", () => {
    renderNoPainel(
      <SidePanelHeader
        pedido={buildPedidoView({ tipo: "misto", destinatario: "X" })}
      />,
    );
    expect(screen.getByText("Misto")).toBeInTheDocument();
  });
});
