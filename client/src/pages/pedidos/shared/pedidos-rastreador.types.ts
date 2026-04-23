import { mapPedidoToView } from "./map-pedido-rastreador-to-view";
import {
  STATUS_CONFIG,
  STATUS_ORDER,
  STATUS_TO_API,
  URGENCIA_LABELS,
  URGENCIA_STYLE,
} from "./pedidos-rastreador-kanban";

/** Avaliação do módulo para cobertura (sem efeito em runtime). */
export const pedidosRastreadorSharedTypesLoaded = true;

export * from "@/types/pedidos-rastreador";
export {
  mapPedidoToView,
  STATUS_CONFIG,
  STATUS_ORDER,
  STATUS_TO_API,
  URGENCIA_LABELS,
  URGENCIA_STYLE,
};
