import type { StatusPedidoKey, StatusPedidoRastreador } from "@/types/pedidos-rastreador";

export type { StatusPedidoKey } from "@/types/pedidos-rastreador";

export const URGENCIA_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const STATUS_CONFIG: Record<
  StatusPedidoKey,
  { label: string; color: string; dotColor: string }
> = {
  solicitado: {
    label: "Solicitado",
    color: "amber",
    dotColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
  },
  em_configuracao: {
    label: "Em Configuração",
    color: "blue",
    dotColor: "bg-blue-500",
  },
  configurado: {
    label: "Configurado",
    color: "purple",
    dotColor: "bg-purple-500",
  },
  despachado: {
    label: "Despachado",
    color: "orange",
    dotColor: "bg-orange-500",
  },
  entregue: {
    label: "Entregue",
    color: "emerald",
    dotColor: "bg-emerald-500",
  },
};

export const STATUS_ORDER: StatusPedidoKey[] = [
  "solicitado",
  "em_configuracao",
  "configurado",
  "despachado",
  "entregue",
];

export const STATUS_TO_API: Record<StatusPedidoKey, StatusPedidoRastreador> = {
  solicitado: "SOLICITADO",
  em_configuracao: "EM_CONFIGURACAO",
  configurado: "CONFIGURADO",
  despachado: "DESPACHADO",
  entregue: "ENTREGUE",
};

export const URGENCIA_STYLE: Record<
  string,
  { bar: string; badge: string; valueText: string }
> = {
  Baixa: {
    bar: "border-l-slate-300",
    badge: "bg-slate-50 text-slate-500 border-slate-200",
    valueText: "text-slate-600",
  },
  Média: {
    bar: "border-l-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    valueText: "text-slate-700",
  },
  Alta: {
    bar: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    valueText: "text-amber-600",
  },
  Urgente: {
    bar: "border-l-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    valueText: "text-red-700",
  },
};

export const STATUS_TO_KEY: Record<StatusPedidoRastreador, StatusPedidoKey> = {
  SOLICITADO: "solicitado",
  EM_CONFIGURACAO: "em_configuracao",
  CONFIGURADO: "configurado",
  DESPACHADO: "despachado",
  ENTREGUE: "entregue",
};
