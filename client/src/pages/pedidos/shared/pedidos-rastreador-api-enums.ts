/**
 * Enums/union da API (evita ciclos entre types.ts e módulos shared).
 */
export type StatusPedidoRastreador =
  | "SOLICITADO"
  | "EM_CONFIGURACAO"
  | "CONFIGURADO"
  | "DESPACHADO"
  | "ENTREGUE";
