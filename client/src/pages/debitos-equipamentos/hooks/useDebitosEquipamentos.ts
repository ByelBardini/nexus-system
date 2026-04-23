import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DEBITOS_EQUIPAMENTOS_LISTA_URL,
  DEBITOS_EQUIPAMENTOS_QUERY_KEY,
} from "../domain/debito-equipamento.constants";
import {
  buildOpcoesDevedorCredor,
  buildOpcoesModelo,
  computeDebitosEquipamentosStats,
  filterDebitosEquipamentos,
  type DebitosEquipamentosFilters,
} from "../domain/debitos-equipamentos-helpers";
import { mapDebitoApiToView } from "../domain/mapDebitoApiToView";
import type {
  DebitosEquipamentosApiResponse,
  StatusDebito,
} from "../domain/types";

export function useDebitosEquipamentos() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusDebito | "todos">(
    "todos",
  );
  const [filtroDevedor, setFiltroDevedor] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");

  const { data: apiResponse, isLoading } =
    useQuery<DebitosEquipamentosApiResponse>({
      queryKey: DEBITOS_EQUIPAMENTOS_QUERY_KEY,
      queryFn: () => api(DEBITOS_EQUIPAMENTOS_LISTA_URL),
    });

  const debitos = useMemo(
    () => (apiResponse?.data ?? []).map(mapDebitoApiToView),
    [apiResponse],
  );

  const opcoesDevedor = useMemo(
    () => buildOpcoesDevedorCredor(debitos),
    [debitos],
  );

  const opcoesModelo = useMemo(() => buildOpcoesModelo(debitos), [debitos]);

  const stats = useMemo(
    () => computeDebitosEquipamentosStats(debitos),
    [debitos],
  );

  const filterState: DebitosEquipamentosFilters = useMemo(
    () => ({
      busca,
      filtroStatus,
      filtroDevedor,
      filtroModelo,
    }),
    [busca, filtroStatus, filtroDevedor, filtroModelo],
  );

  const filtered = useMemo(
    () => filterDebitosEquipamentos(debitos, filterState),
    [debitos, filterState],
  );

  const clearFilters = () => {
    setBusca("");
    setFiltroDevedor("");
    setFiltroModelo("");
    setFiltroStatus("todos");
  };

  return {
    expandedId,
    setExpandedId,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    filtroDevedor,
    setFiltroDevedor,
    filtroModelo,
    setFiltroModelo,
    opcoesDevedor,
    opcoesModelo,
    stats,
    filtered,
    debitos,
    clearFilters,
    isLoading,
  };
}
