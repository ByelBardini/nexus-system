import type { PedidoRastreadorView, StatusPedidoKey } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { PedidosKanbanColumnEmptyState } from "@/pages/pedidos/lista/components/PedidosKanbanColumnEmptyState";
import { KanbanCard } from "@/pages/pedidos/lista/kanban/KanbanCard";
import { PedidosKanbanColumnShell } from "@/pages/pedidos/lista/components/PedidosKanbanColumnShell";

export function KanbanColumn({
  status,
  pedidos,
  onCardClick,
}: {
  status: StatusPedidoKey;
  pedidos: PedidoRastreadorView[];
  onCardClick: (p: PedidoRastreadorView) => void;
}) {
  return (
    <PedidosKanbanColumnShell status={status} count={pedidos.length}>
      {pedidos.length === 0 ? (
        <PedidosKanbanColumnEmptyState message="Nenhum pedido nesta etapa" />
      ) : (
        pedidos.map((p) => (
          <KanbanCard key={p.id} pedido={p} onClick={() => onCardClick(p)} />
        ))
      )}
    </PedidosKanbanColumnShell>
  );
}
