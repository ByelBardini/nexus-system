import type { StatusDebito, TipoEntidade } from "./types";

export const STATUS_DEBITO_CONFIG: Record<
  StatusDebito,
  { label: string; className: string }
> = {
  aberto: {
    label: "Aberto",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  parcial: {
    label: "Parcial",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  quitado: {
    label: "Quitado",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

export const ENTIDADE_DEBITO_CONFIG: Record<TipoEntidade, { className: string }> =
  {
    infinity: { className: "bg-erp-blue/10 text-blue-800 border-erp-blue/20" },
    cliente: { className: "bg-slate-100 text-slate-700 border-slate-200" },
  };

export const DEBITOS_EQUIPAMENTOS_QUERY_KEY = [
  "debitos-rastreadores",
] as const;

export const DEBITOS_EQUIPAMENTOS_LISTA_URL =
  "/debitos-rastreadores?limit=500&incluirHistoricos=true";
