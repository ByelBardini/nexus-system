import type { PedidoRastreadorView, StatusPedidoKey } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { PedidosKanbanColumnEmptyState } from "@/pages/pedidos/lista/components/PedidosKanbanColumnEmptyState";
import { KanbanCardConfig } from "@/pages/pedidos/lista/kanban/KanbanCardConfig";
import { PedidosKanbanColumnShell } from "@/pages/pedidos/lista/components/PedidosKanbanColumnShell";

export function KanbanColumnConfig({
  status,
  pedidos,
  progressPorPedido,
  activeId,
  onCardClick,
}: {
  status: StatusPedidoKey;
  pedidos: PedidoRastreadorView[];
  progressPorPedido: Record<number, number>;
  activeId: number | null;
  onCardClick: (p: PedidoRastreadorView) => void;
}) {
  return (
    <PedidosKanbanColumnShell
      status={status}
      count={pedidos.length}
      variant="config"
    >
      {pedidos.length === 0 ? (
        <PedidosKanbanColumnEmptyState
          message={
            status === "configurado"
              ? "Aguardando finalização"
              : "Nenhum pedido"
          }
        />
      ) : (
        pedidos.map((p) => (
          <KanbanCardConfig
            key={p.id}
            pedido={p}
            progress={progressPorPedido[p.id] ?? 0}
            isActive={activeId === p.id}
            onClick={() => onCardClick(p)}
          />
        ))
      )}
    </PedidosKanbanColumnShell>
  );
}
