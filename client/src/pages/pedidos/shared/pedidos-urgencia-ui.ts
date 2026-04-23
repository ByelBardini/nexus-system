import { URGENCIA_STYLE } from "./pedidos-rastreador-kanban";

const FALLBACK = "Média";

export function getUrgenciaBadgeClass(urgencia: string | undefined): string {
  if (!urgencia) return URGENCIA_STYLE[FALLBACK]!.badge;
  return URGENCIA_STYLE[urgencia]?.badge ?? URGENCIA_STYLE[FALLBACK]!.badge;
}

/** Classes para valor textual (ex.: drawer), alinhadas à semântica do kanban. */
export function getUrgenciaValueTextClass(urgencia: string | undefined): string {
  if (!urgencia) return URGENCIA_STYLE[FALLBACK]!.valueText;
  return (
    URGENCIA_STYLE[urgencia]?.valueText ?? URGENCIA_STYLE[FALLBACK]!.valueText
  );
}
