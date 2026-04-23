import type { TecnicoFiltroStatus } from "@/types/tecnicos";
import type { Tecnico } from "./tecnicos.types";

export const TECNICOS_PAGE_SIZE = 10;

export type { TecnicoFiltroStatus } from "@/types/tecnicos";

export function filterTecnicos(
  tecnicos: Tecnico[],
  opts: {
    busca: string;
    filtroEstado: string;
    filtroStatus: TecnicoFiltroStatus;
  },
): Tecnico[] {
  const q = opts.busca.trim().toLowerCase();
  return tecnicos.filter((t) => {
    const matchBusca =
      !q || t.nome.toLowerCase().includes(q);
    const matchEstado =
      opts.filtroEstado === "todos" || (t.estado ?? "") === opts.filtroEstado;
    const matchStatus =
      opts.filtroStatus === "todos" ||
      (opts.filtroStatus === "ativo" && t.ativo) ||
      (opts.filtroStatus === "inativo" && !t.ativo);
    return matchBusca && matchEstado && matchStatus;
  });
}

export function paginateTecnicos<T>(
  items: T[],
  page: number,
  pageSize: number = TECNICOS_PAGE_SIZE,
): T[] {
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPagesForCount(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}
