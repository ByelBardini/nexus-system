import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TecnicoResumo } from "@/pages/pedidos/shared/pedidos-rastreador.types";

const QUERY_KEY = ["tecnicos"] as const;
const API_PATH = "/tecnicos" as const;

type Options = { enabled?: boolean };

export function useTecnicosResumoQuery(options?: Options) {
  const enabled = options?.enabled !== false;
  return useQuery<TecnicoResumo[]>({
    queryKey: [...QUERY_KEY],
    queryFn: () => api<TecnicoResumo[]>(API_PATH),
    enabled,
  });
}

export const tecnicosResumoQueryKey = QUERY_KEY;
