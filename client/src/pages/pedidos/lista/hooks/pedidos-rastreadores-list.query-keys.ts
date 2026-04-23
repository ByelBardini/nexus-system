/**
 * Chaves alinhadas ao legado: lista usa `["pedidos-rastreadores", busca]`,
 * tela de config adiciona o segmento `"config"` para cache separado.
 * Invalidar com `queryKey: ["pedidos-rastreadores"]` cobre ambos.
 */
import type { PedidosRastreadoresListScope } from "@/types/pedidos-rastreador";

export type { PedidosRastreadoresListScope } from "@/types/pedidos-rastreador";

export function pedidosRastreadoresListQueryKey(
  scope: PedidosRastreadoresListScope,
  busca: string,
) {
  const q = busca.trim();
  if (scope === "lista") {
    return ["pedidos-rastreadores", q] as const;
  }
  return ["pedidos-rastreadores", "config", q] as const;
}
