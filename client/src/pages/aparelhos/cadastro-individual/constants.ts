import type {
  DestinoDefeito,
  OrigemItem,
  StatusAparelhoCadastroIndividual,
} from "@/types/aparelhos-cadastro-individual";

export type {
  DestinoDefeito,
  OrigemItem,
} from "@/types/aparelhos-cadastro-individual";
export type StatusAparelho = StatusAparelhoCadastroIndividual;

export const ORIGENS: { value: OrigemItem; label: string }[] = [
  { value: "RETIRADA_CLIENTE", label: "Retirada de Cliente" },
  { value: "DEVOLUCAO_TECNICO", label: "Devolução de Técnico" },
  { value: "COMPRA_AVULSA", label: "Compra Avulsa" },
];

export const DESTINOS_SWITCH: { value: DestinoDefeito; label: string }[] = [
  { value: "DESCARTADO", label: "Descartado" },
  { value: "EM_ESTOQUE_DEFEITO", label: "Em Estoque (defeito)" },
];

export const STATUS_CONFIG: Record<
  StatusAparelho,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  NOVO_OK: {
    label: "Novo / OK",
    icon: "check_circle",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-500",
  },
  EM_MANUTENCAO: {
    label: "Usado",
    icon: "build",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-500",
  },
  CANCELADO_DEFEITO: {
    label: "Defeito",
    icon: "cancel",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-500",
  },
};
