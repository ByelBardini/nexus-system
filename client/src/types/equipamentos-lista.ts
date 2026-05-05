import type { StatusAparelho } from "@/types/aparelho-status";

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
  pedidoDespacho?: {
    tipoDespacho: string | null;
    transportadora: string | null;
    numeroNf: string | null;
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

export type EquipamentosListFiltros = {
  busca: string;
  pipelineFilter: EquipamentoPipelineFilter;
  statusFilter: string;
  proprietarioFilter: "TODOS" | "INFINITY" | "CLIENTE";
  marcaFilter: string;
  operadoraFilter: string;
};

export type EquipamentoStatusPresentation =
  | {
      kind: "em_kit";
      label: string;
      dotClass: string;
      badgeClass: string;
      headerIcon: string;
    }
  | {
      kind: "standard";
      label: string;
      dotClass: string;
      badgeClass: string;
      headerIcon: string;
    };
