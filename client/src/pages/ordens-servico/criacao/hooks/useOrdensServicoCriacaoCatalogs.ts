import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useClientesComSubclientesQuery } from "@/hooks/useClientesComSubclientesQuery";
import type {
  AparelhoRastreadorList,
  Cliente,
  SubclienteFull,
  Tecnico,
} from "../ordens-servico-criacao.types";

type OrdensServicoCriacaoCatalogs = {
  clientes: Cliente[];
  clienteInfinityId: number | null;
  subclientes: SubclienteFull[];
  clienteSelecionado: Cliente | null;
  tecnicos: Tecnico[];
  rastreadoresInstalados: AparelhoRastreadorList[];
};

export function useOrdensServicoCriacaoCatalogs(
  ordemInstalacao: "INFINITY" | "CLIENTE",
  clienteOrdemId: number | undefined,
): OrdensServicoCriacaoCatalogs {
  const { data: clientes = [] } = useClientesComSubclientesQuery();

  const { data: clienteInfinityData } = useQuery<{
    clienteId: number | null;
  }>({
    queryKey: ["ordens-servico", "cliente-infinity"],
    queryFn: () => api("/ordens-servico/cliente-infinity"),
  });
  const clienteInfinityId = clienteInfinityData?.clienteId ?? null;

  const { data: infinityClienteDetalhes } = useQuery<{
    subclientes?: SubclienteFull[];
  }>({
    queryKey: ["clientes", clienteInfinityId, "subclientes"],
    queryFn: () => api(`/clientes/${clienteInfinityId}`),
    enabled: clienteInfinityId != null,
  });

  const clienteSelecionado =
    ordemInstalacao === "CLIENTE"
      ? (clientes.find((c) => c.id === clienteOrdemId) ?? null)
      : null;

  const subclientes =
    ordemInstalacao === "INFINITY"
      ? (infinityClienteDetalhes?.subclientes ?? [])
      : (clienteSelecionado?.subclientes ?? []);

  const { data: tecnicos = [] } = useQuery<Tecnico[]>({
    queryKey: ["tecnicos"],
    queryFn: () => api("/tecnicos"),
  });

  const { data: aparelhosRaw = [] } = useQuery<AparelhoRastreadorList[]>({
    queryKey: ["aparelhos"],
    queryFn: () => api("/aparelhos"),
  });

  const rastreadoresInstalados = useMemo(() => {
    return aparelhosRaw.filter(
      (a) =>
        a.tipo === "RASTREADOR" &&
        a.status === "INSTALADO" &&
        (a.identificador ?? "").trim(),
    );
  }, [aparelhosRaw]);

  return {
    clientes,
    clienteInfinityId,
    subclientes,
    clienteSelecionado,
    tecnicos,
    rastreadoresInstalados,
  };
}
