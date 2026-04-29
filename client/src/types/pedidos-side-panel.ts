import type {
  PedidoRastreadorApi,
  PedidoRastreadorView,
  StatusPedidoKey,
} from "@/types/pedidos-rastreador";
import type { KitVinculado, TipoDespacho } from "@/types/pedidos-config";

export type ResumoAparelhosDoKit = {
  marcasModelos: string[];
  operadoras: string[];
  empresas: string[];
};

export type SidePanelDerivations = {
  estaConcluido: boolean;
  statusIdx: number;
  podeRetroceder: boolean;
  statusAnterior: StatusPedidoKey | null;
  proximoStatus: StatusPedidoKey | null;
  progress: number;
  total: number;
  progressPct: number;
  podeDespachar: boolean;
  bloqueiaAvançoParaConfigurado: boolean;
  bloqueiaAvançoParaDespacho: boolean;
  podeAvançar: boolean;
  mostraConcluir: boolean;
};

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
  onSaveDespacho: (data: {
    tipoDespacho: string;
    transportadora: string;
    numeroNf: string;
  }) => void;
};
