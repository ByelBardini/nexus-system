import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CLIENTES_PAGE_SIZE,
  getClientesFooterStats,
  type Cliente,
} from "../shared/clientes-page.shared";

export const CLIENTES_QUERY_KEY = ["clientes"] as const;
/** Mesmo endpoint; outras telas usam esta chave — invalidar junto ao salvar cliente. */
export const CLIENTES_LISTA_QUERY_KEY = ["clientes-lista"] as const;

export function useClientesPageList() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busca, setBuscaState] = useState("");
  const [filtroTipoContrato, setFiltroTipoContratoState] =
    useState<string>("todos");
  const [filtroEstoque, setFiltroEstoqueState] = useState<string>("todos");
  const [page, setPage] = useState(0);

  const setBusca = (v: string) => {
    setBuscaState(v);
    setPage(0);
  };
  const setFiltroTipoContrato = (v: string) => {
    setFiltroTipoContratoState(v);
    setPage(0);
  };
  const setFiltroEstoque = (v: string) => {
    setFiltroEstoqueState(v);
    setPage(0);
  };

  const {
    data: clientes = [],
    isLoading,
    isError,
    error,
  } = useQuery<Cliente[]>({
    queryKey: CLIENTES_QUERY_KEY,
    queryFn: () => api("/clientes"),
  });

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const matchBusca =
        !busca.trim() ||
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.nomeFantasia?.toLowerCase().includes(busca.toLowerCase()) ||
        c.cnpj?.includes(busca);
      const matchTipoContrato =
        filtroTipoContrato === "todos" || c.tipoContrato === filtroTipoContrato;
      const matchEstoque =
        filtroEstoque === "todos" ||
        (filtroEstoque === "proprio" && c.estoqueProprio) ||
        (filtroEstoque === "terceiro" && !c.estoqueProprio);
      return matchBusca && matchTipoContrato && matchEstoque;
    });
  }, [clientes, busca, filtroTipoContrato, filtroEstoque]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CLIENTES_PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = page * CLIENTES_PAGE_SIZE;
    return filtered.slice(start, start + CLIENTES_PAGE_SIZE);
  }, [filtered, page]);

  const footerStats = useMemo(
    () => getClientesFooterStats(clientes, filtered),
    [clientes, filtered],
  );

  return {
    clientes,
    isLoading,
    isError,
    error,
    filtered,
    paginated,
    totalPages,
    page,
    setPage,
    footerStats,
    expandedId,
    setExpandedId,
    busca,
    setBusca,
    filtroTipoContrato,
    setFiltroTipoContrato,
    filtroEstoque,
    setFiltroEstoque,
  };
}
