import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  mapPedidoToView,
  STATUS_ORDER,
  type PedidoRastreadorView,
  type StatusPedidoKey,
} from "./shared/pedidos-rastreador.types";
import { KanbanColumn } from "./lista/kanban/KanbanColumn";
import { DrawerDetalhes } from "./lista/components/DrawerDetalhes";
import { ModalNovoPedido } from "./novo-pedido/ModalNovoPedido";
import { usePedidosRastreadoresListQuery } from "./lista/hooks/usePedidosRastreadoresListQuery";
import { PedidosRastreadoresListToolbar } from "./lista/components/PedidosRastreadoresListToolbar";

export function PedidosRastreadoresPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] =
    useState<PedidoRastreadorView | null>(null);
  const [modalNovoPedidoOpen, setModalNovoPedidoOpen] = useState(false);

  const { data: lista, isLoading } = usePedidosRastreadoresListQuery({
    busca,
    scope: "lista",
  });

  const pedidosView = useMemo(() => {
    const arr = lista?.data ?? [];
    return arr.map(mapPedidoToView);
  }, [lista?.data]);

  const pedidosPorStatus = useMemo(() => {
    const porStatus: Record<StatusPedidoKey, PedidoRastreadorView[]> = {
      solicitado: [],
      em_configuracao: [],
      configurado: [],
      despachado: [],
      entregue: [],
    };
    pedidosView.forEach((p) => porStatus[p.status].push(p));
    return porStatus;
  }, [pedidosView]);

  function handleCardClick(pedido: PedidoRastreadorView) {
    setPedidoSelecionado(pedido);
    setDrawerOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] min-h-0">
      <PedidosRastreadoresListToolbar
        value={busca}
        onValueChange={setBusca}
        placeholder="Buscar pedido ou destino..."
        rightSlot={
          <Button
            onClick={() => setModalNovoPedidoOpen(true)}
            className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase"
          >
            <MaterialIcon name="add" className="text-sm mr-1" />
            Novo Pedido
          </Button>
        }
      />

      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="overflow-auto bg-slate-100 p-4 flex-1 min-h-0">
          <div className="flex gap-4 min-w-max min-h-[420px]">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                pedidos={pedidosPorStatus[status]}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        </div>
      </div>

      <DrawerDetalhes
        pedido={pedidoSelecionado}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDeleted={() => setPedidoSelecionado(null)}
      />

      <ModalNovoPedido
        open={modalNovoPedidoOpen}
        onOpenChange={setModalNovoPedidoOpen}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["pedidos-rastreadores"] })
        }
      />
    </div>
  );
}
