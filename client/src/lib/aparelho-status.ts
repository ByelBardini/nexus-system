/**
 * Configuração centralizada de status de aparelho (workflow: estoque → instalado).
 * Usado em AparelhosPage, EquipamentosPage e páginas de aparelhos.
 */
import type {
  StatusAparelho,
  StatusConfigAparelho,
} from "@/types/aparelho-status";

export type {
  StatusAparelho,
  StatusConfigAparelho,
} from "@/types/aparelho-status";

export const STATUS_CONFIG_APARELHO: Record<
  StatusAparelho,
  StatusConfigAparelho
> = {
  EM_ESTOQUE: {
    label: "Em Estoque",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: "🟡",
    dotColor: "bg-amber-500",
  },
  CONFIGURADO: {
    label: "Configurado",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "🔵",
    dotColor: "bg-blue-500",
  },
  DESPACHADO: {
    label: "Despachado",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: "🟠",
    dotColor: "bg-amber-500",
  },
  COM_TECNICO: {
    label: "Com Técnico",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: "🟠",
    dotColor: "bg-orange-500",
  },
  INSTALADO: {
    label: "Instalado",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: "🟢",
    dotColor: "bg-emerald-500",
  },
};
