import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AparelhoDescartado = {
  id: number;
  tipo: "RASTREADOR" | "SIM";
  identificador: string | null;
  proprietario: "INFINITY" | "CLIENTE";
  marca: string | null;
  modelo: string | null;
  operadora: string | null;
  categoriaFalha: string | null;
  motivoDefeito: string | null;
  responsavel: string | null;
  descartadoEm: string | null;
  criadoEm: string;
};

type TipoFilter = "RASTREADOR" | "SIM" | "TODOS";

export function useDescartadosList() {
  const [busca, setBusca] = useState("");
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("TODOS");

  const query = useQuery<AparelhoDescartado[]>({
    queryKey: ["aparelhos-descartados"],
    queryFn: () => api("/aparelhos/descartados"),
  });

  const lista = useMemo(() => {
    const dados = query.data ?? [];
    const termoBusca = busca.trim().toLowerCase();

    return dados.filter((d) => {
      if (tipoFilter !== "TODOS" && d.tipo !== tipoFilter) return false;
      if (
        termoBusca &&
        !(d.identificador ?? "").toLowerCase().includes(termoBusca)
      )
        return false;
      return true;
    });
  }, [query.data, busca, tipoFilter]);

  return {
    lista,
    isLoading: query.isLoading,
    busca,
    setBusca,
    tipoFilter,
    setTipoFilter,
  };
}
