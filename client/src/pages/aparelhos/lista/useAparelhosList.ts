import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StatusAparelho } from "@/lib/aparelho-status";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Aparelho,
  ProprietarioTipo,
  TipoAparelho,
} from "./aparelhos-page.shared";
import { PAGE_SIZE } from "./aparelhos-page.shared";
import {
  computeMarcasDisponiveis,
  computeStatusCounts,
  filterAparelhos,
  kitMapFromList,
  slicePagina,
  totalPaginas,
} from "./aparelhos-list.helpers";

export function useAparelhosList() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CONFIGURACAO.APARELHO.CRIAR");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusAparelho | "TODOS">(
    "TODOS",
  );
  const [tipoFilter, setTipoFilter] = useState<TipoAparelho | "TODOS">("TODOS");
  const [proprietarioFilter, setProprietarioFilter] = useState<
    ProprietarioTipo | "TODOS"
  >("TODOS");
  const [marcaFilter, setMarcaFilter] = useState<string>("TODOS");
  const [page, setPage] = useState(0);

  const { data: aparelhos = [], isLoading } = useQuery<Aparelho[]>({
    queryKey: ["aparelhos"],
    queryFn: () => api("/aparelhos"),
  });

  const { data: kits = [] } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ["aparelhos", "pareamento", "kits"],
    queryFn: () => api("/aparelhos/pareamento/kits"),
  });

  const kitsPorId = useMemo(() => kitMapFromList(kits), [kits]);

  const marcas = useMemo(
    () => computeMarcasDisponiveis(aparelhos),
    [aparelhos],
  );

  const statusCounts = useMemo(
    () => computeStatusCounts(aparelhos),
    [aparelhos],
  );

  const totalCount = useMemo(() => {
    return Object.values(statusCounts).reduce((a, b) => a + b, 0);
  }, [statusCounts]);

  const filtros = useMemo(
    () => ({
      busca,
      statusFilter,
      tipoFilter,
      proprietarioFilter,
      marcaFilter,
    }),
    [busca, statusFilter, tipoFilter, proprietarioFilter, marcaFilter],
  );

  const filtered = useMemo(
    () => filterAparelhos(aparelhos, filtros),
    [aparelhos, filtros],
  );

  const totalPages = totalPaginas(filtered.length, PAGE_SIZE);

  const paginated = useMemo(
    () => slicePagina(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  function handleStatusClick(status: StatusAparelho | "TODOS") {
    setStatusFilter(status);
    setPage(0);
  }

  return {
    canCreate,
    isLoading,
    expandedId,
    setExpandedId,
    busca,
    setBusca,
    statusFilter,
    setStatusFilter,
    tipoFilter,
    setTipoFilter,
    proprietarioFilter,
    setProprietarioFilter,
    marcaFilter,
    setMarcaFilter,
    page,
    setPage,
    kitsPorId,
    marcas,
    statusCounts,
    totalCount,
    filtered,
    paginated,
    totalPages,
    handleStatusClick,
  };
}
