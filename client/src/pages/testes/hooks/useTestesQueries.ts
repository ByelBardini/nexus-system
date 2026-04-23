import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OsTeste, RastreadorParaTeste } from "../lib/testes-types";

export function useTestesListaQuery(search: string) {
  return useQuery<OsTeste[]>({
    queryKey: ["ordens-servico", "testando", search],
    queryFn: () =>
      api(
        `/ordens-servico/testando?${search ? `search=${encodeURIComponent(search)}` : ""}`,
      ),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useRastreadoresParaTestesQuery(selectedOs: OsTeste | null) {
  return useQuery<RastreadorParaTeste[]>({
    queryKey: [
      "aparelhos",
      "para-testes",
      selectedOs?.clienteId,
      selectedOs?.tecnicoId ?? "null",
      selectedOs?.id,
    ],
    queryFn: () => {
      if (!selectedOs) return [];
      const params = new URLSearchParams({
        clienteId: String(selectedOs.clienteId),
      });
      if (selectedOs.tecnicoId != null)
        params.set("tecnicoId", String(selectedOs.tecnicoId));
      if (selectedOs.id != null)
        params.set("ordemServicoId", String(selectedOs.id));
      return api(`/aparelhos/para-testes?${params}`);
    },
    enabled: !!selectedOs && selectedOs.tipo !== "RETIRADA",
  });
}
