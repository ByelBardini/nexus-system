import { Router, Smartphone } from "lucide-react";
import type { StatusAparelho } from "@/lib/aparelho-status";

export type TipoAparelho = "RASTREADOR" | "SIM";
export type ProprietarioTipo = "INFINITY" | "CLIENTE";

export interface Aparelho {
  id: number;
  identificador?: string | null;
  tipo: TipoAparelho;
  marca?: string | null;
  modelo?: string | null;
  operadora?: string | null;
  marcaSimcard?: {
    id: number;
    nome: string;
    operadora?: { id: number; nome: string };
  } | null;
  planoSimcard?: { id: number; planoMb: number } | null;
  status: StatusAparelho;
  proprietario: ProprietarioTipo;
  cliente?: { id: number; nome: string; cor?: string | null } | null;
  simVinculado?: {
    id: number;
    identificador: string;
    operadora?: string | null;
  } | null;
  aparelhosVinculados?: {
    id: number;
    identificador?: string | null;
    proprietario?: ProprietarioTipo | null;
    kitId?: number | null;
    kit?: { id: number; nome: string } | null;
    tecnicoId?: number | null;
    tecnico?: { id: number; nome: string } | null;
    clienteId?: number | null;
    cliente?: { id: number; nome: string; cor?: string | null } | null;
  }[];
  kitId?: number | null;
  kit?: { id: number; nome: string } | null;
  tecnico?: { id: number; nome: string } | null;
  lote?: { id: number; referencia: string } | null;
  valorUnitario?: number | null;
  ordemServicoVinculada?: {
    numero: number;
    subclienteNome: string | null;
    veiculoPlaca: string | null;
  } | null;
  criadoEm: string;
  historico?: HistoricoItem[];
}

export interface HistoricoItem {
  data: string;
  acao: string;
  descricao?: string;
}

export const TIPO_CONFIG: Record<
  TipoAparelho,
  { label: string; icon: typeof Router }
> = {
  RASTREADOR: { label: "Rastreador", icon: Router },
  SIM: { label: "SIM Card", icon: Smartphone },
};

export const PROPRIETARIO_CONFIG: Record<
  ProprietarioTipo,
  { label: string; className: string }
> = {
  INFINITY: {
    label: "Infinity",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  CLIENTE: {
    label: "Cliente",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export const PAGE_SIZE = 15;

export type AparelhosFiltros = {
  busca: string;
  statusFilter: StatusAparelho | "TODOS";
  tipoFilter: TipoAparelho | "TODOS";
  proprietarioFilter: ProprietarioTipo | "TODOS";
  marcaFilter: string;
};
