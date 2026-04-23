import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Cliente } from "@/pages/ordens-servico/criacao/ordens-servico-criacao.types";

const QUERY_KEY = ["clientes", "subclientes"] as const;
const API_PATH = "/clientes?subclientes=1" as const;

type Options = { enabled?: boolean };

/**
 * Lista clientes com `subclientes` embutidos. Mesma chave usada no fluxo de criação de ordem de serviço.
 */
export function useClientesComSubclientesQuery(options?: Options) {
  const enabled = options?.enabled !== false;
  return useQuery<Cliente[]>({
    queryKey: [...QUERY_KEY],
    queryFn: () => api<Cliente[]>(API_PATH),
    enabled,
  });
}

export const clientesComSubclientesQueryKey = QUERY_KEY;
export const clientesComSubclientesQueryPath = API_PATH;
