import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { tecnicosResumoQueryKey } from "@/hooks/useTecnicosResumoQuery";
import type { Tecnico } from "../lib/tecnicos.types";

export function useTecnicosListQuery() {
  return useQuery<Tecnico[]>({
    queryKey: [...tecnicosResumoQueryKey],
    queryFn: () => api<Tecnico[]>("/tecnicos"),
  });
}
