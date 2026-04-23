import { useMemo, useState } from "react";
import type { Tecnico } from "../lib/tecnicos.types";
import {
  TECNICOS_PAGE_SIZE,
  filterTecnicos,
  paginateTecnicos,
  totalPagesForCount,
  type TecnicoFiltroStatus,
} from "../lib/tecnicos-table.utils";

export function useTecnicosTableState(tecnicos: Tecnico[]) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] =
    useState<TecnicoFiltroStatus>("todos");
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () =>
      filterTecnicos(tecnicos, {
        busca,
        filtroEstado,
        filtroStatus,
      }),
    [tecnicos, busca, filtroEstado, filtroStatus],
  );

  const totalPages = useMemo(
    () => totalPagesForCount(filtered.length, TECNICOS_PAGE_SIZE),
    [filtered.length],
  );

  const paginated = useMemo(
    () => paginateTecnicos(filtered, page, TECNICOS_PAGE_SIZE),
    [filtered, page],
  );

  function setBuscaAndResetPage(value: string) {
    setBusca(value);
    setPage(0);
  }

  function setFiltroEstadoAndResetPage(value: string) {
    setFiltroEstado(value);
    setPage(0);
  }

  function setFiltroStatusAndResetPage(value: TecnicoFiltroStatus) {
    setFiltroStatus(value);
    setPage(0);
  }

  return {
    expandedId,
    setExpandedId,
    busca,
    setBusca: setBuscaAndResetPage,
    filtroEstado,
    setFiltroEstado: setFiltroEstadoAndResetPage,
    filtroStatus,
    setFiltroStatus: setFiltroStatusAndResetPage,
    page,
    setPage,
    filtered,
    paginated,
    totalPages,
  };
}
