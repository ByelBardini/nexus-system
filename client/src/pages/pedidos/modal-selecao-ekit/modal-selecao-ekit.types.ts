import type { PedidoRastreadorView, PedidoRastreadorApi } from "../shared/pedidos-rastreador.types";
import type { KitResumo, KitVinculado } from "../shared/pedidos-config-types";

export interface ModalSelecaoEKitFiltrosPedido {
  clienteId?: number | null;
  modeloEquipamentoId?: number | null;
  marcaEquipamentoId?: number | null;
  operadoraId?: number | null;
}

export interface ModalSelecaoEKitProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pedido: PedidoRastreadorView | null;
  pedidoApi: PedidoRastreadorApi | null;
  onVincular: (kit: KitResumo, qtd: number) => void;
  kitParaEditar?: { id: number; nome: string } | null;
  kitsPorPedido?: Record<number, KitVinculado[]>;
  filtrosPedido?: ModalSelecaoEKitFiltrosPedido | null;
}
