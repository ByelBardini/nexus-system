import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  PedidosRastreadoresListResponse,
  PedidosRastreadoresListScope,
} from "@/types/pedidos-rastreador";
import { pedidosRastreadoresListQueryKey } from "./pedidos-rastreadores-list.query-keys";

export type { PedidosRastreadoresListResponse };

type Options = {
  busca: string;
  scope: PedidosRastreadoresListScope;
  enabled?: boolean;
};

/**
 * Listagem padrão de pedidos de rastreadores (Kanban + configuração compartilham a mesma API).
 */
export function usePedidosRastreadoresListQuery({
  busca,
  scope,
  enabled = true,
}: Options) {
  return useQuery({
    queryKey: pedidosRastreadoresListQueryKey(scope, busca),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "500");
      if (busca.trim()) params.set("search", busca.trim());
      return api<PedidosRastreadoresListResponse>(
        `/pedidos-rastreadores?${params}`,
      );
    },
    enabled,
  });
}
