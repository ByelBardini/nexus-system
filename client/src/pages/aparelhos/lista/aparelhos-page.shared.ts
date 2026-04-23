import { Router, Smartphone } from "lucide-react";
import type { ProprietarioTipo, TipoAparelho } from "@/types/aparelhos-lista";

export type {
  Aparelho,
  AparelhosFiltros,
  HistoricoItem,
  ProprietarioTipo,
  TipoAparelho,
} from "@/types/aparelhos-lista";

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
