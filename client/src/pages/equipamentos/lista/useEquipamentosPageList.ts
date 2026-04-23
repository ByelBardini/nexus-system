import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { kitMapFromList } from "@/pages/aparelhos/lista/aparelhos-list.helpers";
import type {
  EquipamentoListItem,
  EquipamentoPipelineFilter,
} from "./equipamentos-page.shared";
import {
  computeMarcasFromEquipamentos,
  computeOperadorasFromEquipamentos,
  computePipelineCounts,
  filterEquipamentosList,
  sliceEquipamentosPage,
  totalPaginasEquipamentosList,
  listOnlyEquipamentosMontados,
} from "./equipamentos-page.helpers";

export function useEquipamentosPageList() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CONFIGURACAO.APARELHO.CRIAR");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [pipelineFilter, setPipelineFilter] =
    useState<EquipamentoPipelineFilter>("TODOS");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [proprietarioFilter, setProprietarioFilter] = useState<
    "TODOS" | "INFINITY" | "CLIENTE"
  >("TODOS");
  const [marcaFilter, setMarcaFilter] = useState<string>("TODOS");
  const [operadoraFilter, setOperadoraFilter] = useState<string>("TODOS");
  const [page, setPage] = useState(0);

  const { data: aparelhos = [], isLoading } = useQuery<EquipamentoListItem[]>({
    queryKey: ["aparelhos"],
    queryFn: () => api("/aparelhos"),
  });

  const { data: kits = [] } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ["aparelhos", "pareamento", "kits"],
    queryFn: () => api("/aparelhos/pareamento/kits"),
  });

  const kitsPorId = useMemo(() => kitMapFromList(kits), [kits]);

  const equipamentos = useMemo(
    () => listOnlyEquipamentosMontados(aparelhos),
    [aparelhos],
  );

  const marcas = useMemo(
    () => computeMarcasFromEquipamentos(equipamentos),
    [equipamentos],
  );

  const operadoras = useMemo(
    () => computeOperadorasFromEquipamentos(equipamentos),
    [equipamentos],
  );

  const pipelineCounts = useMemo(
    () => computePipelineCounts(equipamentos),
    [equipamentos],
  );

  const filtros = useMemo(
    () => ({
      busca,
      pipelineFilter,
      statusFilter,
      proprietarioFilter,
      marcaFilter,
      operadoraFilter,
    }),
    [
      busca,
      pipelineFilter,
      statusFilter,
      proprietarioFilter,
      marcaFilter,
      operadoraFilter,
    ],
  );

  const filtered = useMemo(
    () => filterEquipamentosList(equipamentos, filtros),
    [equipamentos, filtros],
  );

  const totalPages = totalPaginasEquipamentosList(filtered.length);

  const paginated = useMemo(
    () => sliceEquipamentosPage(filtered, page),
    [filtered, page],
  );

  function handlePipelineClick(filter: EquipamentoPipelineFilter) {
    setPipelineFilter(filter);
    setStatusFilter(filter === "TODOS" ? "TODOS" : filter);
    setPage(0);
  }

  return {
    canCreate,
    isLoading,
    expandedId,
    setExpandedId,
    busca,
    setBusca,
    pipelineFilter,
    setPipelineFilter,
    statusFilter,
    setStatusFilter,
    proprietarioFilter,
    setProprietarioFilter,
    marcaFilter,
    setMarcaFilter,
    operadoraFilter,
    setOperadoraFilter,
    page,
    setPage,
    kitsPorId,
    marcas,
    operadoras,
    pipelineCounts,
    filtered,
    paginated,
    totalPages,
    handlePipelineClick,
  };
}
