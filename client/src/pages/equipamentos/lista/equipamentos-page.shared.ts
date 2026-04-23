import type {
  EquipamentoListItem,
  EquipamentoPipelineFilter,
} from "@/types/equipamentos-lista";

export type {
  EquipamentoListItem,
  EquipamentoPipelineFilter,
} from "@/types/equipamentos-lista";

/** Tamanho da página na listagem de equipamentos montados ({@link EquipamentosPage}). */
export const EQUIPAMENTOS_LIST_PAGE_SIZE = 12;

/**
 * Regra única para cartões de pipeline, filtro de status e contagens por estágio.
 * `filter` aceita {@link EquipamentoPipelineFilter} ou o mesmo valor em string (ex.: select).
 */
export function equipamentoMatchesStageFilter(
  e: EquipamentoListItem,
  filter: string,
): boolean {
  if (filter === "TODOS") return true;
  if (filter === "CONFIGURADO") {
    return e.status === "CONFIGURADO" && !e.kitId;
  }
  if (filter === "EM_KIT") {
    return e.status === "CONFIGURADO" && !!e.kitId;
  }
  if (filter === "DESPACHADO") return e.status === "DESPACHADO";
  if (filter === "COM_TECNICO") return e.status === "COM_TECNICO";
  if (filter === "INSTALADO") return e.status === "INSTALADO";
  return false;
}
