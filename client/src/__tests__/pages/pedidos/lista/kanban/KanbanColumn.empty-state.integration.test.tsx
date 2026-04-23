import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KanbanColumn } from "@/pages/pedidos/lista/kanban/KanbanColumn";
import { KanbanColumnConfig } from "@/pages/pedidos/lista/kanban/KanbanColumnConfig";
import { buildPedidoView } from "../../modal-selecao-ekit/modal-selecao-ekit.fixtures";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

/** Card = role=button que envolve o chip do código; não depende da ordem na lista. */
function cardByCodigo(codigo: string): HTMLElement {
  const chip = screen.getByText(codigo, { exact: true });
  const el = chip.closest<HTMLElement>('[role="button"]');
  if (!el) {
    throw new Error(`Código ${codigo}: nenhum ancestral role="button"`);
  }
  return el;
}

/** Contador exibido ao lado do rótulo da coluna (PedidosKanbanColumnShell). */
function expectHeaderCount(statusLabel: string, expected: number) {
  const label = screen.getByText(statusLabel, { exact: true });
  const row = label.parentElement;
  if (!row) {
    throw new Error(`Sem parent para o rótulo ${statusLabel}`);
  }
  expect(
    within(row).getByText(String(expected), { exact: true }),
  ).toBeInTheDocument();
}

describe("KanbanColumn e KanbanColumnConfig", () => {
  describe("estado vazio", () => {
    it("KanbanColumn: coluna vazia exibe mensagem padrão", () => {
      render(
        <KanbanColumn status="solicitado" pedidos={[]} onCardClick={vi.fn()} />,
      );
      expect(screen.getByText("Nenhum pedido nesta etapa")).toBeInTheDocument();
      expectHeaderCount("Solicitado", 0);
    });

    it("KanbanColumnConfig: vazio em 'configurado' mostra aguardo de finalização", () => {
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

    it("KanbanColumnConfig: vazio em outros status mostra 'Nenhum pedido'", () => {
      const statusSemAguardo = [
        "solicitado",
        "em_configuracao",
        "despachado",
        "entregue",
      ] as const;

      for (const status of statusSemAguardo) {
        const { unmount } = render(
          <KanbanColumnConfig
            status={status}
            pedidos={[]}
            progressPorPedido={{}}
            activeId={null}
            onCardClick={vi.fn()}
          />,
        );
        expect(screen.getByText("Nenhum pedido")).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe("KanbanColumn: lista com pedidos", () => {
    it("cada card permanece vinculado ao pedido correto ao clicar o segundo de dois", async () => {
      const p1 = buildPedidoView({ id: 11, codigo: "K-1" });
      const p2 = buildPedidoView({ id: 12, codigo: "K-2" });
      const onCardClick = vi.fn();
      const user = userEvent.setup();

      render(
        <KanbanColumn
          status="despachado"
          pedidos={[p1, p2]}
          onCardClick={onCardClick}
        />,
      );

      expectHeaderCount("Despachado", 2);
      expect(screen.getByText("K-1")).toBeInTheDocument();
      expect(screen.getByText("K-2")).toBeInTheDocument();
      expect(
        screen.queryByText("Nenhum pedido nesta etapa"),
      ).not.toBeInTheDocument();

      await user.click(cardByCodigo("K-2"));
      expect(onCardClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).toHaveBeenLastCalledWith(p2);

      onCardClick.mockClear();
      await user.click(cardByCodigo("K-1"));
      expect(onCardClick).toHaveBeenLastCalledWith(p1);
    });

    it("clique e Enter no card (foco) disparam a mesma callback (acessibilidade)", async () => {
      const p = buildPedidoView({ id: 1, codigo: "A11Y" });
      const onCardClick = vi.fn();
      const user = userEvent.setup();

      render(
        <KanbanColumn
          status="solicitado"
          pedidos={[p]}
          onCardClick={onCardClick}
        />,
      );

      const card = cardByCodigo("A11Y");
      await user.click(card);
      expect(onCardClick).toHaveBeenLastCalledWith(p);

      onCardClick.mockClear();
      card.focus();
      expect(card).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(onCardClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).toHaveBeenLastCalledWith(p);
    });
  });

  describe("KanbanColumnConfig: coluna de configuração com pedidos", () => {
    it("cada id recebe o progresso do mapa; chave ausente cai em 0", () => {
      const comProgresso = buildPedidoView({ id: 1, codigo: "C-A" });
      const semChave = buildPedidoView({ id: 2, codigo: "C-B" });

      render(
        <KanbanColumnConfig
          status="em_configuracao"
          pedidos={[comProgresso, semChave]}
          progressPorPedido={{ 1: 4 }}
          activeId={null}
          onCardClick={vi.fn()}
        />,
      );

      expect(screen.getByText("04 / 05")).toBeInTheDocument();
      expect(screen.getByText("00 / 05")).toBeInTheDocument();
    });

    it("status 'configurado' com pedidos não reutiliza a mensagem de coluna vazia", () => {
      const p = buildPedidoView({ id: 5, codigo: "CFg-FIL" });
      render(
        <KanbanColumnConfig
          status="configurado"
          pedidos={[p]}
          progressPorPedido={{ 5: 0 }}
          activeId={null}
          onCardClick={vi.fn()}
        />,
      );
      expect(screen.getByText("CFg-FIL")).toBeInTheDocument();
      expect(
        screen.queryByText("Aguardando finalização"),
      ).not.toBeInTheDocument();
    });

    it("clique disambigua o pedido no segundo de dois", async () => {
      const a = buildPedidoView({ id: 7, codigo: "D-A" });
      const b = buildPedidoView({ id: 8, codigo: "D-B" });
      const onCardClick = vi.fn();
      const user = userEvent.setup();

      render(
        <KanbanColumnConfig
          status="em_configuracao"
          pedidos={[a, b]}
          progressPorPedido={{ 7: 0, 8: 3 }}
          activeId={8}
          onCardClick={onCardClick}
        />,
      );

      await user.click(cardByCodigo("D-A"));
      expect(onCardClick).toHaveBeenLastCalledWith(a);
      onCardClick.mockClear();
      await user.click(cardByCodigo("D-B"));
      expect(onCardClick).toHaveBeenLastCalledWith(b);
    });

    it("isActive: nenhum card destaca anel quando activeId é null", () => {
      const a = buildPedidoView({ id: 1, codigo: "N1" });
      const b = buildPedidoView({ id: 2, codigo: "N2" });
      render(
        <KanbanColumnConfig
          status="em_configuracao"
          pedidos={[a, b]}
          progressPorPedido={{ 1: 0, 2: 0 }}
          activeId={null}
          onCardClick={vi.fn()}
        />,
      );
      expect(cardByCodigo("N1")).not.toHaveClass("ring-erp-blue");
      expect(cardByCodigo("N2")).not.toHaveClass("ring-erp-blue");
    });

    it("isActive: id inexistente (órfão) não ativa nenhum card", () => {
      const a = buildPedidoView({ id: 1, codigo: "O1" });
      const b = buildPedidoView({ id: 2, codigo: "O2" });
      render(
        <KanbanColumnConfig
          status="em_configuracao"
          pedidos={[a, b]}
          progressPorPedido={{}}
          activeId={9999}
          onCardClick={vi.fn()}
        />,
      );
      expect(cardByCodigo("O1")).not.toHaveClass("ring-erp-blue");
      expect(cardByCodigo("O2")).not.toHaveClass("ring-erp-blue");
    });

    it("isActive: transição de activeId via rerender move o anel de destaque", () => {
      const a = buildPedidoView({ id: 1, codigo: "R1" });
      const b = buildPedidoView({ id: 2, codigo: "R2" });
      const props = {
        status: "em_configuracao" as const,
        pedidos: [a, b],
        progressPorPedido: { 1: 0, 2: 0 } as Record<number, number>,
        onCardClick: vi.fn(),
      };
      const { rerender } = render(
        <KanbanColumnConfig {...props} activeId={1} />,
      );
      expect(cardByCodigo("R1")).toHaveClass("ring-erp-blue");
      expect(cardByCodigo("R2")).not.toHaveClass("ring-erp-blue");

      rerender(<KanbanColumnConfig {...props} activeId={2} />);
      expect(cardByCodigo("R1")).not.toHaveClass("ring-erp-blue");
      expect(cardByCodigo("R2")).toHaveClass("ring-erp-blue");
    });
  });
});
