import type {
  CategoriaFalha,
  DestinoDefeito,
  OrigemItem,
  StatusAparelhoCadastroIndividual,
} from "@/types/aparelhos-cadastro-individual";

export type {
  CategoriaFalha,
  DestinoDefeito,
  OrigemItem,
} from "@/types/aparelhos-cadastro-individual";
export type StatusAparelho = StatusAparelhoCadastroIndividual;

export const ORIGENS: { value: OrigemItem; label: string }[] = [
  { value: "RETIRADA_CLIENTE", label: "Retirada de Cliente" },
  { value: "DEVOLUCAO_TECNICO", label: "Devolução de Técnico" },
  { value: "COMPRA_AVULSA", label: "Compra Avulsa" },
];

export const CATEGORIAS_FALHA: { value: CategoriaFalha; label: string }[] = [
  { value: "FALHA_COMUNICACAO", label: "Falha de Comunicação (GPRS)" },
  { value: "PROBLEMA_ALIMENTACAO", label: "Problema de Alimentação" },
  { value: "DANO_FISICO", label: "Dano Físico / Carcaça" },
  { value: "CURTO_CIRCUITO", label: "Curto-circuito Interno" },
  { value: "OUTRO", label: "Outro" },
];

export const DESTINOS_DEFEITO: { value: DestinoDefeito; label: string }[] = [
  { value: "SUCATA", label: "Sucata / Descarte" },
  { value: "GARANTIA", label: "Envio para Garantia" },
  { value: "LABORATORIO", label: "Laboratório Interno" },
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
    label: "Em Manutenção",
    icon: "build",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-500",
  },
  CANCELADO_DEFEITO: {
    label: "Cancelado / Defeito",
    icon: "cancel",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-500",
  },
};
