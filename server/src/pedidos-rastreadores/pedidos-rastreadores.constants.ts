import { StatusPedidoRastreador } from '@prisma/client';

/** Ordem linear de avanço do pedido (usada em validações de transição de status). */
export const ORDEM_STATUS_PEDIDO_RASTREADOR: StatusPedidoRastreador[] = [
  StatusPedidoRastreador.SOLICITADO,
  StatusPedidoRastreador.EM_CONFIGURACAO,
  StatusPedidoRastreador.CONFIGURADO,
  StatusPedidoRastreador.DESPACHADO,
  StatusPedidoRastreador.ENTREGUE,
];
