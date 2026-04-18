import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/MaterialIcon";
import { api } from "@/lib/api";
import {
  mapPedidoToView,
  STATUS_ORDER,
  type PedidoRastreadorView,
  type StatusPedidoKey,
} from "./types";
import { KanbanColumn } from "./KanbanColumn";
import { DrawerDetalhes } from "./DrawerDetalhes";
import { ModalNovoPedido } from "./ModalNovoPedido";

export function PedidosRastreadoresPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] =
    useState<PedidoRastreadorView | null>(null);
  const [modalNovoPedidoOpen, setModalNovoPedidoOpen] = useState(false);

  const { data: lista, isLoading } = useQuery({
    queryKey: ["pedidos-rastreadores", busca],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("limit", "500");
      if (busca.trim()) params.set("search", busca.trim());
      return api<{ data: unknown[] }>(`/pedidos-rastreadores?${params}`);
    },
  });

  const pedidosView = useMemo(() => {
    const arr = (lista?.data ?? []) as Parameters<typeof mapPedidoToView>[0][];
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
      <div className="flex items-center justify-between gap-4 shrink-0 pb-4">
        <div className="relative flex-1 max-w-xs">
          <MaterialIcon
            name="search"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <Input
            className="pl-8 text-[11px]"
            placeholder="Buscar pedido ou destino..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setModalNovoPedidoOpen(true)}
            className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase"
          >
            <MaterialIcon name="add" className="text-sm mr-1" />
            Novo Pedido
          </Button>
        </div>
      </div>

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
