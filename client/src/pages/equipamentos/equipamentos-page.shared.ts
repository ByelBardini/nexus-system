import type { StatusAparelho } from "@/lib/aparelho-status";

export type EquipamentoPipelineFilter =
  | "TODOS"
  | "CONFIGURADO"
  | "EM_KIT"
  | "DESPACHADO"
  | "COM_TECNICO"
  | "INSTALADO";

/** Aparelho (rastreador) como retornado em listagens usadas na página de equipamentos montados. */
export interface EquipamentoListItem {
  id: number;
  identificador?: string | null;
  tipo: "RASTREADOR" | "SIM";
  marca?: string | null;
  modelo?: string | null;
  operadora?: string | null;
  status: StatusAparelho;
  proprietario: "INFINITY" | "CLIENTE";
  cliente?: { id: number; nome: string } | null;
  ordemServicoVinculada?: {
    numero: number;
    subclienteNome: string | null;
    veiculoPlaca: string | null;
  } | null;
  simVinculado?: {
    id: number;
    identificador: string;
    operadora?: string | null;
    marcaSimcard?: { id: number; nome: string } | null;
    planoSimcard?: { id: number; planoMb: number } | null;
    lote?: { id: number; referencia: string } | null;
  } | null;
  kitId?: number | null;
  kit?: { id: number; nome: string } | null;
  tecnico?: { id: number; nome: string } | null;
  lote?: { id: number; referencia: string } | null;
  criadoEm: string;
  atualizadoEm: string;
  historico?: {
    statusAnterior: string;
    statusNovo: string;
    observacao?: string | null;
    criadoEm: string;
  }[];
}

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
