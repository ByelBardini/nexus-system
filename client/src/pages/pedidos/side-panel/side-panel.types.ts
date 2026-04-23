import type { PedidoRastreadorView, PedidoRastreadorApi } from "../shared/pedidos-rastreador.types";
import type { KitVinculado, TipoDespacho } from "../shared/pedidos-config-types";

export type SidePanelProps = {
  pedido: PedidoRastreadorView | null;
  pedidoApi: PedidoRastreadorApi | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
  kitsVinculados: KitVinculado[];
  onKitsChange: (kits: KitVinculado[]) => void;
  tipoDespacho: TipoDespacho;
  onTipoDespachoChange: (tipo: TipoDespacho) => void;
  kitsPorPedido: Record<number, KitVinculado[]>;
  transportadora: string;
  numeroNf: string;
  onTransportadoraChange: (valor: string) => void;
  onNumeroNfChange: (valor: string) => void;
};
