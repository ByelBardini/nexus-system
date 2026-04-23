import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KanbanCardConfig } from "@/pages/pedidos/lista/kanban/KanbanCardConfig";
import { URGENCIA_STYLE } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { buildPedidoView } from "../../modal-selecao-ekit/modal-selecao-ekit.fixtures";

describe("KanbanCardConfig (urgência alinhada ao URGENCIA_STYLE)", () => {
  it("badge de Alta usa classes do mapa central", () => {
    const pedido = buildPedidoView({ urgencia: "Alta" });
    render(
      <KanbanCardConfig
        pedido={pedido}
        progress={0}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    const badge = screen.getByText("Alta");
    for (const cls of URGENCIA_STYLE.Alta.badge.split(/\s+/)) {
      if (cls) expect(badge).toHaveClass(cls);
    }
    expect(badge.className).toMatch(/border/);
  });

  it("urgência desconhecida cai no fallback Média no badge", () => {
    const pedido = buildPedidoView({ urgencia: "ZzzInvalido" });
    render(
      <KanbanCardConfig
        pedido={pedido}
        progress={0}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    const badge = screen.getByText("ZzzInvalido");
    for (const cls of URGENCIA_STYLE["Média"]!.badge.split(/\s+/)) {
      if (cls) expect(badge).toHaveClass(cls);
    }
  });

  it("sem urgência não renderiza badge", () => {
    const pedido = buildPedidoView({ urgencia: undefined });
    render(
      <KanbanCardConfig
        pedido={pedido}
        progress={0}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByText("Alta")).not.toBeInTheDocument();
    expect(screen.queryByText("Média")).not.toBeInTheDocument();
  });

  it("onClick e Enter disparam handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const pedido = buildPedidoView();
    render(
      <KanbanCardConfig
        pedido={pedido}
        progress={0}
        isActive={false}
        onClick={onClick}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
