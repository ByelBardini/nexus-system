/**
 * Chaves alinhadas ao legado: lista usa `["pedidos-rastreadores", busca]`,
 * tela de config adiciona o segmento `"config"` para cache separado.
 * Invalidar com `queryKey: ["pedidos-rastreadores"]` cobre ambos.
 */
export type PedidosRastreadoresListScope = "lista" | "config";

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
